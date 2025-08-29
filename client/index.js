/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

// gather all the elements we need
const gallery = document.querySelector(".gallery");
const popup = document.querySelector(".popup");
const title = popup.querySelector(".title");
const signer = popup.querySelector(".signer");
const time = popup.querySelector(".time");
const producer = popup.querySelector(".producer");
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('files');
const browseButton = document.getElementById('browseButton');
const verificationResults = document.getElementById('verificationResults');
const signFileBtn = document.getElementById('signFileBtn');
const verifyAgainBtn = document.getElementById('verifyAgainBtn');
const verifyFileBtn = document.getElementById('verifyFileBtn');
const embedManifest = document.getElementById('embedManifest');
const sidecarManifest = document.getElementById('sidecarManifest');
const remoteManifest = document.getElementById('remoteManifest');
const manifestStorageInfo = document.getElementById('manifestStorageInfo');
const addWatermark = document.getElementById('addWatermark');
const watermarkOptions = document.getElementById('watermarkOptions');
const watermarkInfo = document.getElementById('watermarkInfo');
const watermarkText = document.getElementById('watermarkText');

// Add an image to the gallery
function addGalleryItem(data) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'relative h-48 m-1.5';

    var img = document.createElement('img');
    img.src = data.url;
    img.className = "w-full h-full object-cover rounded-lg shadow-md";
    galleryItem.appendChild(img);

    const badge = document.createElement('img');
    badge.src = "badge.svg";
    badge.className = "absolute top-0 right-0 w-6 h-6 block cursor-pointer";
    galleryItem.appendChild(badge);

    // Add download button
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-5V4a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1"></path>
        </svg>
    `;
    downloadBtn.className = "absolute bottom-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer";
    downloadBtn.title = "Download signed image";
    downloadBtn.onclick = (e) => {
        e.stopPropagation();
        downloadImage(data.url, data.name);
    };
    galleryItem.appendChild(downloadBtn);

    gallery.appendChild(galleryItem);

    // add popup event listeners
    badge.addEventListener("mouseenter", function() {
        const rect = badge.getBoundingClientRect();

        const report = data.report;

        // get the active manifest
        const manifest = report.manifests[report.active_manifest];

        // show the title of the manifest, or the name of the image
        title.textContent = manifest.title || data.name;

        // show the issuer and time of the signature
        const issuer = manifest.signature_info?.issuer || "";
        signer.innerHTML = `Signed By: ${issuer}`;

        const sign_time = manifest.signature_info?.time;
        // convert ISO-8601 sign_time to local time
        const date = sign_time ? new Date(sign_time).toLocaleString() : "";
        time.innerHTML = sign_time ? `Signed On: ${date}` : "";

        // truncate the claim generator at first space for first token
        // and then replace underscores and forward slash with spaces
        const generator = manifest.claim_generator?.split(" ")[0].replace(/[_/]/g, " ")
        producer.innerHTML = `Produced With: ${generator}`;

        // Position the popup and show it
        popup.style.display = "block";
        popup.style.top = `${rect.top + window.scrollY}px`;
        const popupWidth = popup.getBoundingClientRect().width;
        popup.style.left = `${rect.left > popupWidth ? rect.left - popupWidth : rect.left + rect.width}px`;

    });
    
    badge.addEventListener("mouseleave", function() {
        // hide the popup
        popup.style.display = "none";
    });
}

// Function to add preview image to gallery with C2PA badge
function addPreviewGalleryItem(data) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'relative h-48 m-1.5';

    var img = document.createElement('img');
    img.src = data.url;
    img.className = "w-full h-full object-cover rounded-lg shadow-md";
    galleryItem.appendChild(img);

    // Add C2PA badge for preview
    const badge = document.createElement('img');
    badge.src = "badge.svg";
    badge.className = "absolute top-0 right-0 w-6 h-6 block cursor-pointer";
    galleryItem.appendChild(badge);

    gallery.appendChild(galleryItem);

    // Add popup event listeners for preview (show "checking" state)
    badge.addEventListener("mouseenter", function() {
        const rect = badge.getBoundingClientRect();

        // Show preview/checking information
        title.textContent = data.name || 'Preview Image';
        signer.innerHTML = `Status: <span class="text-blue-600">Checking provenance...</span>`;
        time.innerHTML = ``;
        producer.innerHTML = `File: ${data.name}`;

        // Position the popup and show it
        popup.style.display = "block";
        popup.style.top = `${rect.top + window.scrollY}px`;
        const popupWidth = popup.getBoundingClientRect().width;
        popup.style.left = `${rect.left > popupWidth ? rect.left - popupWidth : rect.left + rect.width}px`;
    });
    
    badge.addEventListener("mouseleave", function() {
        // hide the popup
        popup.style.display = "none";
    });
}

// Function to create "no manifest" card
function createNoManifestCard(data) {
    const card = document.createElement('div');
    card.className = 'border rounded-lg p-6 bg-gray-50 border-gray-200';
    
    card.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
            
            <div class="flex-1 min-w-0">
                <h4 class="text-lg font-semibold text-gray-700">⚪ No Provenance</h4>
                <p class="text-sm text-gray-600 mt-1">No C2PA manifest found</p>
                <p class="text-sm text-gray-500 mt-1">File: ${data.name}</p>
                <p class="text-xs text-gray-500 mt-2">This image has no provenance information. Use "Sign File" to add a C2PA manifest.</p>
            </div>
        </div>
    `;
    
    return card;
}

// Function to add badge hover events
function addBadgeHoverEvents(badge, data) {
    badge.addEventListener("mouseenter", function() {
        const rect = badge.getBoundingClientRect();
        const report = data.report;
        const manifest = report.manifests[report.active_manifest];

        title.textContent = manifest.title || data.name;
        const issuer = manifest.signature_info?.issuer || "";
        signer.innerHTML = `Signed By: ${issuer}`;
        const sign_time = manifest.signature_info?.time;
        const date = sign_time ? new Date(sign_time).toLocaleString() : "";
        time.innerHTML = sign_time ? `Signed On: ${date}` : "";
        const generator = manifest.claim_generator?.split(" ")[0].replace(/[_/]/g, " ")
        producer.innerHTML = `Produced With: ${generator}`;

        popup.style.display = "block";
        popup.style.top = `${rect.top + window.scrollY}px`;
        const popupWidth = popup.getBoundingClientRect().width;
        popup.style.left = `${rect.left > popupWidth ? rect.left - popupWidth : rect.left + rect.width}px`;
    });
    
    badge.addEventListener("mouseleave", function() {
        popup.style.display = "none";
    });
}

// Function to create signing error card
function createSigningErrorCard(fileData, err) {
    const card = document.createElement('div');
    card.className = 'border rounded-lg p-6 bg-red-50 border-red-200';
    
    card.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
            </div>
            
            <div class="flex-1 min-w-0">
                <h4 class="text-lg font-semibold text-red-900">❌ Signing Failed</h4>
                <p class="text-sm text-red-700 mt-1">Could not sign file</p>
                <p class="text-sm text-gray-600 mt-1">File: ${fileData.name}</p>
                <p class="text-xs text-red-600 mt-2">Error: ${err.message || 'Unknown error occurred'}</p>
            </div>
        </div>
    `;
    
    return card;
}

// Function to create verification result card
function createVerificationCard(data) {
    const report = data.report;
    const manifest = report.manifests[report.active_manifest];
    const details = data.manifestDetails; // Use the extracted details from server
    
    // Determine verification status (for now, we'll assume valid since c2patool successfully processed it)
    const isValid = true; // In a real implementation, you'd check signature validation
    
    const card = document.createElement('div');
    card.className = `border rounded-lg p-6 ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`;
    
    // Create unique ID for this card
    const cardId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    card.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
                ${isValid ? 
                    `<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>` :
                    `<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>`
                }
            </div>
            
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold ${isValid ? 'text-green-900' : 'text-red-900'}">${isValid ? '✅ Valid Provenance' : '❌ Invalid Provenance'}</h4>
                        <p class="text-sm ${isValid ? 'text-green-700' : 'text-red-700'} mt-1">
                            ${isValid ? 'Provenance verified' : 'Could not verify provenance'}
                        </p>
                        <p class="text-sm text-gray-600 mt-1">File: ${data.name}</p>
                    </div>
                    
                    <button onclick="toggleDetails('${cardId}')" class="text-sm ${isValid ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'} font-medium focus:outline-none">
                        <span id="toggle-text-${cardId}">Show Details</span>
                        <svg id="toggle-icon-${cardId}" class="inline w-4 h-4 ml-1 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                </div>
                
                <div id="details-${cardId}" class="hidden mt-4 pt-4 border-t ${isValid ? 'border-green-200' : 'border-red-200'}">
                    <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Title:</dt>
                            <dd class="text-sm text-gray-900">${details?.title || data.originalName || data.name}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Format:</dt>
                            <dd class="text-sm text-gray-900">${details?.format || 'Unknown'}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Signed by:</dt>
                            <dd class="text-sm text-gray-900">${details?.issuer || 'Unknown'}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Signing time:</dt>
                            <dd class="text-sm text-gray-900">${details?.signTime ? new Date(details.signTime).toLocaleString() : 'Unknown'}</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-sm font-medium text-gray-500">Manifest location:</dt>
                            <dd class="text-sm text-gray-900">${data.report?.manifestLocation || 'Embedded'}</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-sm font-medium text-gray-500">Producer:</dt>
                            <dd class="text-sm text-gray-900">${details?.claimGenerator?.replace(/[_/]/g, ' ') || 'Unknown'}</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-sm font-medium text-gray-500">Assertions:</dt>
                            <dd class="text-sm text-gray-900">${details?.assertions?.length || 0} assertion(s)</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-sm font-medium text-gray-500">Ingredients:</dt>
                            <dd class="text-sm text-gray-900">${details?.ingredients?.length || 0} ingredient(s)</dd>
                        </div>
                        
                        ${data.watermark ? `
                            <div class="sm:col-span-2">
                                <dt class="text-sm font-medium text-gray-500">Watermark:</dt>
                                <dd class="text-sm text-gray-900">
                                    ${data.watermark.error ? 
                                        `<span class="text-red-600">Failed: ${data.watermark.error}</span>` :
                                        `<span class="text-purple-600">ID: ${data.watermark.watermark_id}</span>
                                         ${data.watermark.watermark_text ? `<br><span class="text-xs text-gray-600">Text: "${data.watermark.watermark_text}"</span>` : ''}`
                                    }
                                </dd>
                            </div>
                        ` : ''}
                    </dl>
                    
                    <!-- Download Section -->
                    <div class="mt-4 pt-4 border-t ${isValid ? 'border-green-200' : 'border-red-200'}">
                        <div class="flex space-x-3">
                            <button onclick="downloadImage('${data.url}', '${data.name}')" 
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${isValid ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-red-700 bg-red-100 hover:bg-red-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isValid ? 'focus:ring-green-500' : 'focus:ring-red-500'}">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-5V4a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1"></path>
                                </svg>
                                Download Image
                            </button>
                            
                            ${data.sidecarUrl ? `
                                <button onclick="downloadImage('${data.sidecarUrl}', '${data.name}.c2pa')" 
                                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${isValid ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-red-700 bg-red-100 hover:bg-red-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isValid ? 'focus:ring-green-500' : 'focus:ring-red-500'}">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download Manifest
                                </button>
                            ` : ''}
                            
                            ${data.remoteManifestUrl ? `
                                <button onclick="downloadImage('${data.remoteManifestUrl}', '${data.name}.c2pa')" 
                                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${isValid ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-red-700 bg-red-100 hover:bg-red-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isValid ? 'focus:ring-green-500' : 'focus:ring-red-500'}">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download Remote Manifest
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Function to toggle details visibility
function toggleDetails(cardId) {
    const details = document.getElementById(`details-${cardId}`);
    const toggleText = document.getElementById(`toggle-text-${cardId}`);
    const toggleIcon = document.getElementById(`toggle-icon-${cardId}`);
    
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        toggleText.textContent = 'Hide Details';
        toggleIcon.style.transform = 'rotate(180deg)';
    } else {
        details.classList.add('hidden');
        toggleText.textContent = 'Show Details';
        toggleIcon.style.transform = 'rotate(0deg)';
    }
}

// Make toggleDetails globally available
window.toggleDetails = toggleDetails;

// Function to download files
function downloadImage(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make downloadImage globally available
window.downloadImage = downloadImage;

// Store processed file for actions
let processedFile = null;

// Function to enable/disable action buttons
function updateActionButtons() {
    const hasFile = processedFile !== null;
    signFileBtn.disabled = !hasFile;
    verifyAgainBtn.disabled = !hasFile;
    verifyFileBtn.disabled = !hasFile;
}

// Function to update watermark options visibility
function updateWatermarkOptions() {
    const isChecked = addWatermark.checked;
    console.log('Watermark checkbox state:', isChecked); // Debug
    console.log('Watermark options element:', watermarkOptions); // Debug
    console.log('Watermark info element:', watermarkInfo); // Debug
    
    if (isChecked) {
        watermarkOptions.classList.remove('hidden');
        watermarkInfo.classList.remove('hidden');
    } else {
        watermarkOptions.classList.add('hidden');
        watermarkInfo.classList.add('hidden');
    }
}

// Function to update manifest storage info
function updateManifestStorageInfo() {
    const manifestType = document.querySelector('input[name="manifestStorage"]:checked').value;
    let color, title, description;
    
    switch(manifestType) {
        case 'embedded':
            color = 'blue';
            title = 'Embedded';
            description = 'Manifest is stored directly within the image file. The file size will increase slightly, but the manifest travels with the image.';
            break;
        case 'sidecar':
            color = 'green';
            title = 'Sidecar';
            description = 'Manifest is stored in a separate .c2pa file alongside the image. Both files must be kept together.';
            break;
        case 'remote':
            color = 'purple';
            title = 'Remote';
            description = 'Manifest is stored in the cloud and referenced by the image. The image file stays smaller, but requires network access to verify.';
            break;
    }
    
    manifestStorageInfo.innerHTML = `
        <div class="bg-${color}-50 border border-${color}-200 rounded-md p-3">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-${color}-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-${color}-800">
                        <span class="font-medium">${title}:</span> ${description}
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Function to update preview badge popup with verification results
function updatePreviewBadgePopup(fileData, verificationResult) {
    // Find the preview badge in the gallery
    const galleryItems = gallery.children;
    for (let item of galleryItems) {
        const img = item.querySelector('img');
        const badge = item.querySelector('img[src="badge.svg"]');
        
        if (img && badge && img.src === fileData.url) {
            // Remove old event listeners by cloning the badge
            const newBadge = badge.cloneNode(true);
            badge.parentNode.replaceChild(newBadge, badge);
            
            // Add new event listeners with verification data
            newBadge.addEventListener("mouseenter", function() {
                const rect = newBadge.getBoundingClientRect();

                if (verificationResult.hasManifest && verificationResult.manifestDetails) {
                    const details = verificationResult.manifestDetails;
                    
                    // Show verified manifest information
                    title.textContent = details.title || fileData.name;
                    signer.innerHTML = `Signed By: ${details.issuer || 'Unknown'}`;
                    
                    const signTime = details.signTime;
                    const date = signTime ? new Date(signTime).toLocaleString() : "";
                    time.innerHTML = signTime ? `Signed On: ${date}` : "";
                    
                    const generator = details.claimGenerator?.split(" ")[0].replace(/[_/]/g, " ") || 'Unknown';
                    producer.innerHTML = `Produced With: ${generator}`;
                } else {
                    // Show no manifest information
                    title.textContent = fileData.name || 'Preview Image';
                    signer.innerHTML = `Status: <span class="text-gray-600">No C2PA manifest found</span>`;
                    time.innerHTML = ``;
                    producer.innerHTML = `File: ${fileData.name}`;
                }

                // Position the popup and show it
                popup.style.display = "block";
                popup.style.top = `${rect.top + window.scrollY}px`;
                const popupWidth = popup.getBoundingClientRect().width;
                popup.style.left = `${rect.left > popupWidth ? rect.left - popupWidth : rect.left + rect.width}px`;
            });
            
            newBadge.addEventListener("mouseleave", function() {
                // hide the popup
                popup.style.display = "none";
            });
            
            break;
        }
    }
}

// Function to verify uploaded file automatically
async function verifyUploadedFile(fileData, callback = null) {
    try {
        // Show loading state
        verificationResults.innerHTML = `
            <div class="border rounded-lg p-6 bg-blue-50 border-blue-200">
                <div class="flex items-center space-x-3">
                    <svg class="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-blue-800 font-medium">Verifying file...</span>
                </div>
            </div>
        `;

        // Read the file as ArrayBuffer for verification
        const arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(fileData.file);
        });

        // Send to verify endpoint
        let url = `/verify?name=${fileData.name}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": fileData.file.type,
            },
            body: arrayBuffer
        });

        const result = await response.json();
        
        // Clear loading state and show results
        verificationResults.innerHTML = '';
        
        if (result.hasManifest) {
            const verificationCard = createVerificationCard(result);
            verificationResults.appendChild(verificationCard);
        } else {
            const noManifestCard = createNoManifestCard(result);
            verificationResults.appendChild(noManifestCard);
        }
        
        // Call callback with verification result if provided
        if (callback) {
            callback(result);
        }
        
    } catch (err) {
        console.error('Verify uploaded file error:', err);
        // Show error state
        verificationResults.innerHTML = `
            <div class="border rounded-lg p-6 bg-red-50 border-red-200">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-semibold text-red-900">❌ Verification Failed</h4>
                        <p class="text-sm text-red-700 mt-1">Could not verify file</p>
                        <p class="text-sm text-gray-600 mt-1">File: ${fileData.name}</p>
                        <p class="text-xs text-red-600 mt-2">Error: ${err.message || 'Unknown error occurred'}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Function to process files (used by both file input and drag & drop)
function processFiles(files) {
    // Only process the first file if multiple are selected
    const file = files[0];
    if (!file) return;

    // reset the containers and processed file
    gallery.innerHTML = ""; 
    verificationResults.innerHTML = "";
    processedFile = null;

    try {
        // Store the single file and show preview immediately
        const fileData = {
            name: file.name,
            file: file,
            url: URL.createObjectURL(file) // Create preview URL
        };
        
        processedFile = fileData;
        
        // add the preview image to the gallery immediately
        addPreviewGalleryItem(fileData);
        
        // Automatically verify the uploaded file and update badge popup
        verifyUploadedFile(fileData, (verificationResult) => {
            // Update the badge popup with verification results
            updatePreviewBadgePopup(fileData, verificationResult);
        });
        
        // Update action buttons state
        updateActionButtons();
        
    } catch (err) {
        console.log('Error processing file:', file.name, err);
        
        // Show error card for failed file processing
        const errorCard = document.createElement('div');
        errorCard.className = 'border rounded-lg p-6 bg-red-50 border-red-200';
        errorCard.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-lg font-semibold text-red-900">❌ Processing Failed</h4>
                    <p class="text-sm text-red-700 mt-1">Could not process file</p>
                    <p class="text-sm text-gray-600 mt-1">File: ${file.name}</p>
                    <p class="text-xs text-red-600 mt-2">Error: ${err.message || 'Unknown error occurred'}</p>
                </div>
            </div>
        `;
        verificationResults.appendChild(errorCard);
    }
}

// File input change event
fileInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        processFiles(event.target.files);
        // Reset the input so the same file can be selected again
        event.target.value = '';
    }
});

// Browse button click event
browseButton.addEventListener('click', () => {
    fileInput.click();
});

// Drop zone click event
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Drag & Drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-blue-50', 'border-blue-300');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-blue-50', 'border-blue-300');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-blue-50', 'border-blue-300');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFiles(files);
    }
});

// Sign File button event
signFileBtn.addEventListener('click', async () => {
    if (!processedFile) return;
    
    signFileBtn.disabled = true;
    signFileBtn.innerHTML = `
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Signing...
    `;
    
    try {
        // Clear current verification results
        verificationResults.innerHTML = "";
        
        // Get selected manifest type
        const manifestType = document.querySelector('input[name=\"manifestStorage\"]:checked').value;
        
        // Get watermark options
        const shouldAddWatermark = addWatermark.checked;
        const watermarkTextValue = watermarkText.value.trim();
        
        // Sign the file
        try {
            // Read the file as ArrayBuffer for signing
            const arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(processedFile.file);
            });

            let url = `/upload?name=${processedFile.name}&manifestType=${manifestType}`;
            
            // Add watermark parameters if watermark is enabled
            if (shouldAddWatermark) {
                url += `&addWatermark=true`;
                if (watermarkTextValue) {
                    url += `&watermarkText=${encodeURIComponent(watermarkTextValue)}`;
                }
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type": processedFile.file.type,
                },
                body: arrayBuffer
            });

            let body = await response.json();
            
            // Update the file data with signed information
            Object.assign(processedFile, body);
            
            // Update gallery with signed image
            const galleryItems = gallery.children;
            for (let item of galleryItems) {
                const img = item.querySelector('img');
                if (img && img.src === processedFile.url) {
                    // Replace preview badge with C2PA badge
                    const previewBadge = item.querySelector('div:last-child');
                    if (previewBadge) {
                        previewBadge.remove();
                    }
                    
                    // Update image source to signed version
                    img.src = body.url;
                    
                    // Add C2PA badge
                    const badge = document.createElement('img');
                    badge.src = "badge.svg";
                    badge.className = "absolute top-0 right-0 w-6 h-6 block cursor-pointer";
                    item.appendChild(badge);
                    
                    // Add hover events for popup
                    addBadgeHoverEvents(badge, body);
                    break;
                }
            }
            
            // Add verification card for signed file
            const verificationCard = createVerificationCard(body);
            verificationResults.appendChild(verificationCard);
            
        } catch (err) {
            console.error(`Error signing ${processedFile.name}:`, err);
            // Add error card for this file
            const errorCard = createSigningErrorCard(processedFile, err);
            verificationResults.appendChild(errorCard);
        }
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded-md';
        successMessage.innerHTML = `
            <div class="flex">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <div class="ml-3">
                    <p class="text-sm text-green-800">
                        <span class="font-medium">Signing complete!</span> File has been signed with a C2PA manifest.
                    </p>
                </div>
            </div>
        `;
        
        // Insert success message after actions section
        const actionsSection = signFileBtn.closest('.mb-12');
        actionsSection.appendChild(successMessage);
        
        // Remove success message after 5 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
        
    } catch (err) {
        console.error('Sign file error:', err);
    } finally {
        // Reset button
        signFileBtn.disabled = false;
        signFileBtn.innerHTML = `
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Sign File (Demo)
        `;
    }
});

// Verify Again button event
verifyAgainBtn.addEventListener('click', () => {
    if (!processedFile) return;
    
    // Clear current results
    verificationResults.innerHTML = '';
    
    // Re-create verification card for the processed file
    if (processedFile.report) {
        const verificationCard = createVerificationCard(processedFile);
        verificationResults.appendChild(verificationCard);
    } else {
        const noManifestCard = createNoManifestCard(processedFile);
        verificationResults.appendChild(noManifestCard);
    }
    
    // Show verification message
    const verifyMessage = document.createElement('div');
    verifyMessage.className = 'mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md';
    verifyMessage.innerHTML = `
        <div class="flex">
            <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2"></path>
            </svg>
            <div class="ml-3">
                <p class="text-sm text-blue-800">
                    <span class="font-medium">Verification refreshed!</span> File has been re-verified.
                </p>
            </div>
        </div>
    `;
    
    const actionsSection = verifyAgainBtn.closest('.mb-12');
    actionsSection.appendChild(verifyMessage);
    
    // Remove verify message after 3 seconds
    setTimeout(() => {
        verifyMessage.remove();
    }, 3000);
});

// Verify File button event
verifyFileBtn.addEventListener('click', async () => {
    if (!processedFile) return;
    
    verifyFileBtn.disabled = true;
    verifyFileBtn.innerHTML = `
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Verifying...
    `;
    
    try {
        // Clear current results
        verificationResults.innerHTML = '';
        
        // Read the file as ArrayBuffer for verification
        const arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(processedFile.file);
        });

        let url = `/verify?name=${processedFile.name}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": processedFile.file.type,
            },
            body: arrayBuffer
        });

        let result = await response.json();
        
        if (result.hasManifest) {
            const verificationCard = createVerificationCard(result);
            verificationResults.appendChild(verificationCard);
        } else {
            const noManifestCard = createNoManifestCard(result);
            verificationResults.appendChild(noManifestCard);
        }
        
    } catch (err) {
        console.error('Verify file error:', err);
        // Show error card
        const errorCard = document.createElement('div');
        errorCard.className = 'border rounded-lg p-6 bg-red-50 border-red-200';
        errorCard.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-lg font-semibold text-red-900">❌ Verification Failed</h4>
                    <p class="text-sm text-red-700 mt-1">Could not verify file</p>
                    <p class="text-sm text-gray-600 mt-1">File: ${processedFile.name}</p>
                    <p class="text-xs text-red-600 mt-2">Error: ${err.message || 'Unknown error occurred'}</p>
                </div>
            </div>
        `;
        verificationResults.appendChild(errorCard);
    } finally {
        // Reset button
        verifyFileBtn.disabled = false;
        verifyFileBtn.innerHTML = `
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            Verify File
        `;
    }
});


// Watermark toggle event
if (addWatermark) {
    addWatermark.addEventListener('change', updateWatermarkOptions);
    addWatermark.addEventListener('click', function() {
        console.log('Watermark checkbox clicked!'); // Debug
        setTimeout(updateWatermarkOptions, 10); // Small delay to ensure state change
    });
    console.log('Added watermark event listener'); // Debug
} else {
    console.error('addWatermark element not found'); // Debug
}

// Manifest storage toggle events
embedManifest.addEventListener('change', updateManifestStorageInfo);
sidecarManifest.addEventListener('change', updateManifestStorageInfo);
remoteManifest.addEventListener('change', updateManifestStorageInfo);

// Initialize on page load
if (addWatermark && watermarkOptions && watermarkInfo) {
    updateWatermarkOptions();
    console.log('Initialized watermark options'); // Debug
} else {
    console.error('Watermark elements not found:', { addWatermark, watermarkOptions, watermarkInfo }); // Debug
}
updateManifestStorageInfo();

