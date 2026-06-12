let signaturePad; // Declare signaturePad as global variable

// Initialize signature pad when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing signature pad...");
  
  // Get canvas element after DOM is loaded
  const canvas = document.getElementById("signature-pad");
  console.log("Canvas element found:", canvas);
  
  if (canvas) {
    // Set up canvas with proper DPI scaling for mobile
    const context = canvas.getContext('2d');
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set display size (CSS size)
    const width = 500;
    const height = 200;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Set actual size of canvas (memory size for rendering)
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    
    // Scale canvas drawing operations to match device pixel ratio
    context.scale(devicePixelRatio, devicePixelRatio);
    
    console.log("Canvas DPI scaling applied. Device ratio:", devicePixelRatio);
    console.log("Canvas dimensions - Display:", width, 'x', height, '| Memory:', canvas.width, 'x', canvas.height);
    
    // Initialize signature pad
    try {
      signaturePad = new SignaturePad(canvas, {
        penColor: '#000000',
        backgroundColor: '#ffffff',
        minWidth: 0.5,
        maxWidth: 2.5,
        velocityFilterWeight: 0.7,
        throttle: 16, // ms between consecutive points
        minDistance: 3 // px minimum distance between points to create a line
      });
      
      console.log("Signature pad created successfully:", signaturePad);
      
      // Handle window resize for responsive canvas
      window.addEventListener('resize', () => {
        const canvas = document.getElementById("signature-pad");
        if (canvas && canvas.offsetWidth > 0) {
          const context = canvas.getContext('2d');
          const devicePixelRatio = window.devicePixelRatio || 1;
          const width = canvas.offsetWidth;
          const height = canvas.offsetHeight;
          
          canvas.width = width * devicePixelRatio;
          canvas.height = height * devicePixelRatio;
          context.scale(devicePixelRatio, devicePixelRatio);
          
          // Redraw signature if exists
          if (signaturePad && !signaturePad.isEmpty()) {
            const imageData = signaturePad.toDataURL();
            signaturePad.clear();
            signaturePad.fromDataURL(imageData);
          }
        }
      });
      
      window.clearSignature = () => {
        if (signaturePad) {
          signaturePad.clear();
          console.log("Canvas cleared");
        }
      };
      console.log("Signature pad initialized successfully with mobile-optimized settings");
      console.log("signaturePad is now:", signaturePad);
      
      // Update dropdown after initialization
      if (typeof updateSignatureDropdown === 'function') {
        updateSignatureDropdown();
      }
      if (typeof updateQuickSignatureDropdown === 'function') {
        updateQuickSignatureDropdown();
      }
    } catch (error) {
      console.error("Error initializing signature pad:", error);
    }
  } else {
    console.error("Signature pad canvas not found");
  }
});

// Update quick signature dropdown - defined globally
window.updateQuickSignatureDropdown = () => {
  const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
  const quickSelect = document.getElementById("quickSignatureSelect");

  if (!quickSelect) return;

  // Save current selection
  const currentValue = quickSelect.value;
  
  // Clear and repopulate
  quickSelect.innerHTML = '<option value="">-- Select a signature to load --</option>';
  
  if (savedSignatures.length > 0) {
    savedSignatures.forEach(signature => {
      const option = document.createElement('option');
      option.value = signature.name;
      option.textContent = `${signature.name} (${new Date(signature.createdAt).toLocaleDateString()})`;
      quickSelect.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && savedSignatures.find(sig => sig.name === currentValue)) {
      quickSelect.value = currentValue;
    }
  }
};

// Save signature function - defined globally
window.saveSignature = () => {
  console.log("=== SAVE SIGNATURE DEBUG ===");
  console.log("Save signature button clicked");
  
  console.log("signaturePad object:", signaturePad);
  console.log("signaturePad type:", typeof signaturePad);
  
  if (!signaturePad) {
    console.error("Signature pad not initialized");
    alert("Signature pad not initialized. Please refresh the page.");
    return;
  }
  
  console.log("signaturePad.isEmpty():", signaturePad.isEmpty());
  
  if (signaturePad.isEmpty()) {
    console.log("Signature pad is empty");
    alert("Please draw a signature before saving.");
    return;
  }

  try {
    console.log("Getting signature data...");
    const signatureData = signaturePad.toDataURL();
    console.log("Signature data captured, length:", signatureData.length);
    console.log("Signature data type:", typeof signatureData);
    console.log("Signature data preview:", signatureData.substring(0, 50) + "...");
    
    console.log("Getting existing signatures from localStorage...");
    const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
    console.log("Current saved signatures:", savedSignatures.length);
    console.log("savedSignatures array:", savedSignatures);
    
    // Get signature name from user
    const signatureName = prompt("Enter a name for this signature (e.g., 'Default', 'Personal', 'Business'):");
    console.log("User entered name:", signatureName);
    
    if (!signatureName || signatureName.trim() === "") {
      console.log("No valid name entered, cancelling save");
      alert("Please enter a valid signature name.");
      return;
    }

    const trimmedName = signatureName.trim();
    console.log("Trimmed name:", trimmedName);

    // Check if signature name already exists
    const existingIndex = savedSignatures.findIndex(sig => sig.name === trimmedName);
    console.log("Existing signature index:", existingIndex);
    
    if (existingIndex !== -1) {
      console.log("Signature already exists, asking for replacement");
      if (confirm(`A signature named "${trimmedName}" already exists. Do you want to replace it?`)) {
        savedSignatures[existingIndex] = {
          name: trimmedName,
          data: signatureData,
          createdAt: new Date().toISOString()
        };
        console.log("Signature replaced:", trimmedName);
      } else {
        console.log("User cancelled replacement");
        return;
      }
    } else {
      const newSignature = {
        name: trimmedName,
        data: signatureData,
        createdAt: new Date().toISOString()
      };
      savedSignatures.push(newSignature);
      console.log("New signature added:", newSignature);
    }

    console.log("Final signatures array:", savedSignatures);
    console.log("Saving to localStorage...");
    
    localStorage.setItem("savedSignatures", JSON.stringify(savedSignatures));
    
    console.log("Verifying localStorage save...");
    const verifySaved = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
    console.log("Verified saved signatures count:", verifySaved.length);
    
    alert(`Signature "${trimmedName}" saved successfully!`);
    
    // Update both dropdowns
    if (typeof updateSignatureDropdown === 'function') {
      console.log("Updating signature dropdown...");
      updateSignatureDropdown();
    }
    if (typeof updateQuickSignatureDropdown === 'function') {
      console.log("Updating quick signature dropdown...");
      updateQuickSignatureDropdown();
    }
    
    console.log("=== SAVE SIGNATURE COMPLETE ===");
  } catch (error) {
    console.error("Error saving signature:", error);
    console.error("Error stack:", error.stack);
    alert("Error saving signature. Please try again.");
  }
};

// Delete saved signature function - defined globally
window.deleteSavedSignature = () => {
  console.log("Delete signature button clicked");
  
  try {
    const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
    
    if (savedSignatures.length === 0) {
      alert("No saved signatures to delete.");
      return;
    }

    // Create a simple selection interface
    const signatureNames = savedSignatures.map(sig => sig.name);
    const signatureToDelete = prompt(`Enter the name of the signature to delete:\n\nAvailable signatures:\n${signatureNames.join('\n')}`);
    
    if (!signatureToDelete || signatureToDelete.trim() === "") {
      return;
    }

    const indexToDelete = savedSignatures.findIndex(sig => sig.name === signatureToDelete.trim());
    if (indexToDelete === -1) {
      alert(`No signature found with name "${signatureToDelete.trim()}".`);
      return;
    }

    if (confirm(`Are you sure you want to delete the signature "${signatureToDelete.trim()}"?`)) {
      savedSignatures.splice(indexToDelete, 1);
      localStorage.setItem("savedSignatures", JSON.stringify(savedSignatures));
      console.log("Signature deleted:", signatureToDelete.trim());
      alert(`Signature "${signatureToDelete.trim()}" deleted successfully!`);
      
      // Update both dropdowns
      if (typeof updateSignatureDropdown === 'function') {
        updateSignatureDropdown();
      }
      if (typeof updateQuickSignatureDropdown === 'function') {
        updateQuickSignatureDropdown();
      }
    }
  } catch (error) {
    console.error("Error deleting signature:", error);
    alert("Error deleting signature. Please try again.");
  }
};

// Load saved signature function - defined globally
window.loadSavedSignature = (signatureName) => {
  console.log("Loading signature:", signatureName);
  
  if (!signaturePad) {
    alert("Signature pad not initialized. Please refresh the page.");
    return;
  }
  
  if (!signatureName || signatureName === "") {
    console.log("No signature selected");
    return;
  }
  
  const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
  const signature = savedSignatures.find(sig => sig.name === signatureName);
  
  if (signature) {
    console.log("Found signature:", signature.name);
    console.log("Signature data length:", signature.data.length);
    
    try {
      // Clear canvas first to ensure clean state
      signaturePad.clear();
      
      // Use signature pad's built-in fromDataURL method with small delay to ensure clear completes
      setTimeout(() => {
        signaturePad.fromDataURL(signature.data, { ratio: window.devicePixelRatio || 1 });
        console.log("Signature loaded successfully using fromDataURL with DPI ratio");
        
        // Show success message
        const canvas = document.getElementById("signature-pad");
        if (canvas) {
          // Add a temporary visual feedback
          canvas.style.borderColor = "#28a745";
          setTimeout(() => {
            canvas.style.borderColor = "#ccc";
          }, 1000);
        }
      }, 50);
    } catch (error) {
      console.error("Error loading signature:", error);
      alert("Error loading signature. Please try again.");
    }
  } else {
    console.log("Signature not found:", signatureName);
    alert(`Signature "${signatureName}" not found.`);
  }
};

// Update signature dropdown - defined globally
window.updateSignatureDropdown = () => {
  const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
  const signatureList = document.getElementById("signatureList");
  const noSignaturesMessage = document.getElementById("noSignaturesMessage");

  if (!signatureList || !noSignaturesMessage) return;

  signatureList.innerHTML = '';
  
  if (savedSignatures.length === 0) {
    noSignaturesMessage.style.display = 'block';
  } else {
    noSignaturesMessage.style.display = 'none';
    
    savedSignatures.forEach(signature => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a class="dropdown-item" href="#" onclick="loadSavedSignature('${signature.name}'); return false;">
          <i class="fas fa-signature me-2"></i>${signature.name}
          <small class="text-muted d-block">${new Date(signature.createdAt).toLocaleDateString()}</small>
        </a>
      `;
      signatureList.appendChild(li);
    });
  }
};

// Signature Gallery Functions
window.showSignatureGallery = () => {
  console.log("Opening signature gallery...");
  
  try {
    const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
    const galleryContent = document.getElementById("signatureGalleryContent");
    const noSignaturesGallery = document.getElementById("noSignaturesGallery");
    const modal = document.getElementById("signatureGalleryModal");
    
    if (!galleryContent || !noSignaturesGallery || !modal) {
      console.error("Gallery elements not found");
      return;
    }
    
    galleryContent.innerHTML = '';
    
    if (savedSignatures.length === 0) {
      galleryContent.style.display = 'none';
      noSignaturesGallery.style.display = 'block';
    } else {
      galleryContent.style.display = 'grid';
      noSignaturesGallery.style.display = 'none';
      
      savedSignatures.forEach((signature, index) => {
        const signatureCard = document.createElement('div');
        signatureCard.style.cssText = `
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        `;
        
        signatureCard.innerHTML = `
          <div style="margin-bottom: 10px; font-weight: 600; color: #333;">${signature.name}</div>
          <canvas id="gallery-canvas-${index}" width="200" height="100" style="border: 1px solid #ddd; background: white; border-radius: 4px; width: 100%; max-width: 200px; height: auto;"></canvas>
          <div style="margin-top: 10px; font-size: 12px; color: #666;">
            Created: ${new Date(signature.createdAt).toLocaleDateString()}
          </div>
          <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
            <button onclick="event.stopPropagation(); loadSignatureFromGallery('${signature.name}')" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; flex: 1;">
              <i class="fas fa-download"></i> Load
            </button>
            <button onclick="event.stopPropagation(); deleteSignatureFromGallery('${signature.name}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; flex: 1;">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        `;
        
        galleryContent.appendChild(signatureCard);
        
        // Draw signature on canvas
        setTimeout(() => {
          const canvas = document.getElementById(`gallery-canvas-${index}`);
          if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = signature.data;
          }
        }, 100);
      });
    }
    
    modal.style.display = 'block';
    console.log("Signature gallery opened with", savedSignatures.length, "signatures");
    
  } catch (error) {
    console.error("Error opening signature gallery:", error);
    alert("Error opening signature gallery. Please try again.");
  }
};

window.closeSignatureGallery = () => {
  const modal = document.getElementById("signatureGalleryModal");
  if (modal) {
    modal.style.display = 'none';
  }
};

window.loadSignatureFromGallery = (signatureName) => {
  console.log("Loading signature from gallery:", signatureName);
  
  if (typeof loadSavedSignature === 'function') {
    loadSavedSignature(signatureName);
    closeSignatureGallery();
  } else {
    console.error("loadSavedSignature function not found");
  }
};

window.deleteSignatureFromGallery = (signatureName) => {
  console.log("Deleting signature from gallery:", signatureName);
  
  if (confirm(`Are you sure you want to delete the signature "${signatureName}"?`)) {
    try {
      const savedSignatures = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
      const updatedSignatures = savedSignatures.filter(sig => sig.name !== signatureName);
      localStorage.setItem("savedSignatures", JSON.stringify(updatedSignatures));
      
      console.log("Signature deleted from gallery:", signatureName);
      
      // Refresh gallery
      showSignatureGallery();
      
      // Update both dropdowns
      if (typeof updateSignatureDropdown === 'function') {
        updateSignatureDropdown();
      }
      if (typeof updateQuickSignatureDropdown === 'function') {
        updateQuickSignatureDropdown();
      }
      
      alert(`Signature "${signatureName}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting signature from gallery:", error);
      alert("Error deleting signature. Please try again.");
    }
  }
};

// Mobile Optimization - Prevent scrolling while drawing on canvas
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById("signature-pad");
  if (canvas) {
    // Prevent default touch behaviors on canvas
    canvas.addEventListener('touchstart', function(e) {
      // Don't prevent default completely, but handle touch carefully
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', function(e) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', function(e) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Prevent double-tap zoom
    canvas.addEventListener('dblclick', function(e) {
      e.preventDefault();
    });
    
    // Log touch information for debugging
    canvas.addEventListener('touchstart', function(e) {
      console.log("Touch started - Touches:", e.touches.length, "Touch identifier:", e.touches[0]?.identifier);
    });
    
    canvas.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        console.log("Single touch move detected");
      }
    });
    
    console.log("Mobile touch event handlers attached to canvas");
  }
});
      if (typeof updateSignatureDropdown === 'function') {
        updateSignatureDropdown();
      }
      if (typeof updateQuickSignatureDropdown === 'function') {
        updateQuickSignatureDropdown();
      }
      
      alert(`Signature "${signatureName}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting signature from gallery:", error);
      alert("Error deleting signature. Please try again.");
    }
  }
};

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("signatureGalleryModal");
  if (modal && event.target === modal) {
    closeSignatureGallery();
  }
};
