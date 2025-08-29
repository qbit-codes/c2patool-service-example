/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

var express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const _ = require('lodash');
const fetch = require('node-fetch');
const util = require('util');
const child = require('child_process')
let exec = util.promisify(child.exec);

const port = process.env.PORT || 8000;
const host = process.env.HOST || 'localhost';

var app = express();

// serve our web client
app.use(express.static('client'));

// Allow urls from different folders to be served
let imageFolder = 'uploads'
app.use(express.static(imageFolder));
app.use('/signed-images', express.static('signed-images'));
app.use('/verify-uploads', express.static('verify-uploads'));

// Serve remote manifests
app.use('/remote-manifests', express.static('remote-manifests'));

// Serve .c2pa sidecar files with correct content type
app.get('*.c2pa', (req, res) => {
  const filePath = path.join(__dirname, imageFolder, req.path);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send('Sidecar file not found');
  }
});

// Create local folders for different operations
if(!fs.existsSync(imageFolder)){
  fs.mkdirSync(imageFolder)
}

// Create separate folders for different operations
const verifyFolder = 'verify-uploads';
const signedFolder = 'signed-images';

if(!fs.existsSync(verifyFolder)){
  fs.mkdirSync(verifyFolder)
}

if(!fs.existsSync(signedFolder)){
  fs.mkdirSync(signedFolder)
}

// Enable files upload.
app.use(fileUpload({
  createParentPath: true,
  limits: { 
      fileSize: 2 * 1024 * 1024 * 1024 // max upload file(s) size
  },
}));

// Upload both image and sidecar file
app.post('/upload-with-sidecar', async (req, res) => {
  try {
    if (!req.files || !req.files.image || !req.files.sidecar) {
      return res.status(400).json({ error: 'Both image and sidecar files are required' });
    }

    const imageFile = req.files.image;
    const sidecarFile = req.files.sidecar;
    
    const imagePath = path.join(imageFolder, imageFile.name);
    const sidecarPath = path.join(imageFolder, `${imageFile.name}.c2pa`);
    
    // Save both files
    await imageFile.mv(imagePath);
    await sidecarFile.mv(sidecarPath);
    
    // Verify the uploaded files
    try {
      let command = `./c2patool "${imagePath}" --info`;
      let result = await exec(command);
      let report = JSON.parse(result.stdout);
      
      report.manifestLocation = 'Sidecar';
      
      res.send({
        name: imageFile.name,
        url: `http://${host}:${port}/${imageFile.name}`,
        sidecarUrl: `http://${host}:${port}/${imageFile.name}.c2pa`,
        manifestType: 'sidecar',
        hasManifest: true,
        report
      });
    } catch (verifyErr) {
      res.status(400).json({ error: 'Could not verify uploaded sidecar manifest' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// Add other middleware.
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({type:"image/*",limit:'20mb', extended:true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

// Runs c2patool to get version info using exec
app.get('/version', async function (req, res) {
  try {
    let result = await exec('./c2patool --version');
    console.log(result);
    res.send(result.stdout);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Uploads a file, adds a C2PA manifest and returns a URL
app.post('/upload', async (req, res) => { 
  try {
    let originalFileName = req.query.name;
    let manifestType = req.query.manifestType || 'embedded';
    
    // Create unique filename for signed image
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileExt = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, fileExt);
    const uniqueFileName = `${baseName}_signed_${timestamp}${fileExt}`;
    
    // Use signed-images folder for output
    let signedFilePath = `${signedFolder}/${uniqueFileName}`;
    
    // First save the original file temporarily
    let tempFilePath = `${imageFolder}/${originalFileName}`;
    await fsPromises.appendFile(tempFilePath, Buffer.from(req.body),{flag:'w'});

    let result, report;
    
    if (manifestType === 'sidecar') {
      // Generate sidecar manifest in signed folder
      let command = `./c2patool "${tempFilePath}" -m manifest.json --sidecar -o "${signedFilePath}" -f`;
      result = await exec(command);

      const signedBaseName = path.basename(uniqueFileName, fileExt);
      const sidecarPath = `${signedFolder}/${signedBaseName}.c2pa`;
      
      if (fs.existsSync(sidecarPath)) {
        report = JSON.parse(result.stdout);
        report.manifestLocation = 'Sidecar';
        
        // Extract manifest details for easier access
        const activeManifest = report.manifests[report.active_manifest];
        const manifestDetails = {
          title: activeManifest?.title || originalFileName,
          issuer: activeManifest?.signature_info?.issuer || 'Unknown',
          signTime: activeManifest?.signature_info?.time || null,
          claimGenerator: activeManifest?.claim_generator || 'Unknown',
          format: activeManifest?.format || 'unknown',
          instanceId: activeManifest?.instance_id || null,
          thumbnail: activeManifest?.thumbnail || null,
          assertions: activeManifest?.assertions || [],
          ingredients: activeManifest?.ingredients || []
        };
        
        res.send({
          name: uniqueFileName,
          originalName: originalFileName,
          url: `http://${host}:${port}/signed-images/${uniqueFileName}`,
          sidecarUrl: `http://${host}:${port}/signed-images/${signedBaseName}.c2pa`,
          manifestType: 'sidecar',
          manifestDetails,
          report
        });
      } else {
        throw new Error('Sidecar manifest file not created');
      }
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    } else if (manifestType === 'remote') {
      // For remote manifests, we need to provide a remote URL where the manifest will be hosted
      const remoteManifestUrl = `http://${host}:${port}/remote-manifests/${uniqueFileName}.c2pa`;
      
      // Create remote-manifests directory if it doesn't exist
      const remoteFolder = 'remote-manifests';
      if(!fs.existsSync(remoteFolder)){
        fs.mkdirSync(remoteFolder);
      }
      
      // Use c2patool with --remote flag to embed the remote manifest URL in the image
      let command = `./c2patool "${tempFilePath}" -m manifest.json --remote "${remoteManifestUrl}" -o "${signedFilePath}" -f`;
      result = await exec(command);
      
      // Generate the actual manifest file that would be hosted remotely
      const sidecarCommand = `./c2patool "${tempFilePath}" -m manifest.json --sidecar -o "${remoteFolder}/${uniqueFileName}" -f`;
      await exec(sidecarCommand);
      
      report = JSON.parse(result.stdout);
      report.manifestLocation = `Remote: ${remoteManifestUrl}`;
      
      // Extract manifest details for easier access
      const activeManifest = report.manifests[report.active_manifest];
      const manifestDetails = {
        title: activeManifest?.title || originalFileName,
        issuer: activeManifest?.signature_info?.issuer || 'Unknown',
        signTime: activeManifest?.signature_info?.time || null,
        claimGenerator: activeManifest?.claim_generator || 'Unknown',
        format: activeManifest?.format || 'unknown',
        instanceId: activeManifest?.instance_id || null,
        thumbnail: activeManifest?.thumbnail || null,
        assertions: activeManifest?.assertions || [],
        ingredients: activeManifest?.ingredients || []
      };
      
      res.send({
        name: uniqueFileName,
        originalName: originalFileName,
        url: `http://${host}:${port}/signed-images/${uniqueFileName}`,
        remoteManifestUrl: remoteManifestUrl,
        manifestType: 'remote',
        manifestDetails,
        report
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    } else {
      // Default embedded manifest
      let command = `./c2patool "${tempFilePath}" -m manifest.json -o "${signedFilePath}" -f`;
      result = await exec(command);
      report = JSON.parse(result.stdout);
      report.manifestLocation = 'Embedded';
      
      // Extract manifest details for easier access
      const activeManifest = report.manifests[report.active_manifest];
      const manifestDetails = {
        title: activeManifest?.title || originalFileName,
        issuer: activeManifest?.signature_info?.issuer || 'Unknown',
        signTime: activeManifest?.signature_info?.time || null,
        claimGenerator: activeManifest?.claim_generator || 'Unknown',
        format: activeManifest?.format || 'unknown',
        instanceId: activeManifest?.instance_id || null,
        thumbnail: activeManifest?.thumbnail || null,
        assertions: activeManifest?.assertions || [],
        ingredients: activeManifest?.ingredients || []
      };
      
      res.send({
        name: uniqueFileName,
        originalName: originalFileName,
        url: `http://${host}:${port}/signed-images/${uniqueFileName}`,
        manifestType: 'embedded',
        manifestDetails,
        report
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    }
  } catch (err) {
    console.log(err);
    // return errors to the client
    res.status(500).send(err);
  }
});

// Verify a file and detect manifest source
app.post('/verify', async (req, res) => {
  try {
    let fileName = req.query.name;
    
    // Create unique filename for verification
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const uniqueVerifyFileName = `${baseName}_verify_${timestamp}${fileExt}`;
    
    // Use verify-uploads folder
    let verifyFilePath = `${verifyFolder}/${uniqueVerifyFileName}`;
    let withoutExt = baseName;
    
    // Upload the file for verification
    await fsPromises.appendFile(verifyFilePath, Buffer.from(req.body), {flag:'w'});
    
    try {
      // Try to get manifest info from the file
      let command = `./c2patool "${verifyFilePath}"`;
      let result = await exec(command);
      let report = JSON.parse(result.stdout);
      
      // Determine manifest source
      let manifestLocation = 'Embedded';
      let manifestType = 'embedded';
      
      // Check for sidecar file in verify folder (won't exist for verification, but check anyway)
      const sidecarPath = `${signedFolder}/${withoutExt}.c2pa`;
      if (fs.existsSync(sidecarPath)) {
        manifestLocation = 'Sidecar';
        manifestType = 'sidecar';
      }
      // Check if the manifest contains remote references
      else if (report.manifests && report.active_manifest) {
        const activeManifestId = report.active_manifest;
        const manifest = report.manifests[activeManifestId];
        
        if (manifest) {
          // Check for remote manifest indicators
          // Look for remote URLs in manifest data or validation status
          if (report.validation_status && Array.isArray(report.validation_status)) {
            const remoteStatus = report.validation_status.find(status => 
              status.url && status.url.startsWith('http')
            );
            if (remoteStatus) {
              manifestLocation = `Remote: ${remoteStatus.url}`;
              manifestType = 'remote';
            }
          }
          // If no remote indicators found, it's embedded
          else {
            manifestLocation = 'Embedded';
            manifestType = 'embedded';
          }
        }
      }
      
      report.manifestLocation = manifestLocation;
      
      // Extract manifest details for easier access
      const activeManifest = report.manifests[report.active_manifest];
      const manifestDetails = {
        title: activeManifest?.title || fileName,
        issuer: activeManifest?.signature_info?.issuer || 'Unknown',
        signTime: activeManifest?.signature_info?.time || null,
        claimGenerator: activeManifest?.claim_generator || 'Unknown',
        format: activeManifest?.format || 'unknown',
        instanceId: activeManifest?.instance_id || null,
        thumbnail: activeManifest?.thumbnail || null,
        assertions: activeManifest?.assertions || [],
        ingredients: activeManifest?.ingredients || []
      };

      res.send({
        name: uniqueVerifyFileName,
        originalName: fileName,
        url: `http://${host}:${port}/verify-uploads/${uniqueVerifyFileName}`,
        manifestType: manifestType,
        hasManifest: true,
        manifestDetails,
        report
      });
      
      // Clean up verify file after some delay (optional)
      setTimeout(() => {
        if (fs.existsSync(verifyFilePath)) {
          fs.unlinkSync(verifyFilePath);
        }
      }, 60000); // Clean up after 1 minute
    } catch (verifyErr) {
      // No manifest found or verification failed
      res.send({
        name: uniqueVerifyFileName,
        originalName: fileName,
        url: `http://${host}:${port}/verify-uploads/${uniqueVerifyFileName}`,
        manifestType: 'none',
        hasManifest: false,
        manifestDetails: null,
        error: 'No C2PA manifest found'
      });
      
      // Clean up verify file
      setTimeout(() => {
        if (fs.existsSync(verifyFilePath)) {
          fs.unlinkSync(verifyFilePath);
        }
      }, 60000);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// Handle service worker requests
app.get('/service-worker.js', function (req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'client/service-worker.js'));
});

// the default endpoint is test page for this service
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

// start the http server
app.listen(port, () => 
  console.log(`CAI HTTP server listening on port ${port}.`)
);

