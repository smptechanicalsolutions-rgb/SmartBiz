/**
 * Enhanced Signature Management
 * Fixes and improves signature saving, loading, and validation
 */

// Override/enhance signature functions with better error handling

/**
 * Save signature with validation and error handling
 */
function saveSignatureEnhanced() {
  if (!window.signaturePad) {
    alert('Signature pad not initialized. Please refresh the page.');
    console.error('signaturePad is not defined');
    return;
  }

  // Validate that signature is not empty
  if (window.signaturePad.isEmpty()) {
    alert('Please draw your signature before saving.');
    return;
  }

  try {
    // Get signature as data URL
    const signatureData = window.signaturePad.toDataURL('image/png');
    
    // Validate data
    if (!signatureData || signatureData.length < 100) {
      alert('Signature data is invalid. Please try again.');
      return;
    }

    // Get saved signatures from localStorage
    let savedSignatures = JSON.parse(localStorage.getItem('savedSignatures') || '[]');

    // Prompt for signature name
    const signatureName = prompt('Enter a name for this signature:', 'Signature ' + new Date().toLocaleDateString());
    if (!signatureName) return; // User cancelled

    // Check for duplicates
    const existingIndex = savedSignatures.findIndex(sig => sig.name === signatureName);
    
    if (existingIndex !== -1) {
      if (!confirm(`Signature "${signatureName}" already exists. Replace it?`)) {
        return;
      }
      // Replace existing
      savedSignatures[existingIndex] = {
        name: signatureName,
        data: signatureData,
        createdAt: new Date().toISOString()
      };
    } else {
      // Add new
      savedSignatures.push({
        name: signatureName,
        data: signatureData,
        createdAt: new Date().toISOString()
      });
    }

    // Save to localStorage
    try {
      localStorage.setItem('savedSignatures', JSON.stringify(savedSignatures));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please delete some old signatures.');
        return;
      }
      throw e;
    }

    // Update dropdowns
    updateSignatureDropdown();
    updateQuickSignatureDropdown();

    // Visual feedback
    showSuccessMessage('Signature saved successfully as: ' + signatureName);
    console.log('Signature saved:', signatureName);

  } catch (error) {
    console.error('Error saving signature:', error);
    alert('Error saving signature: ' + error.message);
  }
}

/**
 * Load signature from saved gallery
 */
function loadSignatureEnhanced(name) {
  if (!window.signaturePad) {
    alert('Signature pad not initialized.');
    return;
  }

  try {
    const savedSignatures = JSON.parse(localStorage.getItem('savedSignatures') || '[]');
    const signature = savedSignatures.find(sig => sig.name === name);

    if (!signature) {
      alert('Signature not found.');
      return;
    }

    if (!signature.data) {
      alert('Signature data is corrupted.');
      return;
    }

    // Clear canvas first
    window.signaturePad.clear();

    // Small delay to ensure canvas is cleared
    setTimeout(() => {
      try {
        // Load signature
        window.signaturePad.fromDataURL(signature.data);
        
        // Visual feedback
        showSuccessMessage('Signature loaded: ' + name);
        console.log('Signature loaded:', name);
        
        // Highlight canvas
        const canvas = document.getElementById('signature-pad');
        if (canvas) {
          canvas.style.borderColor = '#28a745';
          setTimeout(() => {
            canvas.style.borderColor = '#ddd';
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading signature from data URL:', error);
        alert('Error loading signature: ' + error.message);
      }
    }, 50);

  } catch (error) {
    console.error('Error in loadSignatureEnhanced:', error);
    alert('Error loading signature: ' + error.message);
  }
}

/**
 * Delete saved signature
 */
function deleteSignatureEnhanced(name) {
  if (!confirm(`Delete signature "${name}"?`)) {
    return;
  }

  try {
    let savedSignatures = JSON.parse(localStorage.getItem('savedSignatures') || '[]');
    const initialLength = savedSignatures.length;
    
    savedSignatures = savedSignatures.filter(sig => sig.name !== name);

    if (savedSignatures.length === initialLength) {
      alert('Signature not found.');
      return;
    }

    localStorage.setItem('savedSignatures', JSON.stringify(savedSignatures));
    
    // Update dropdowns
    updateSignatureDropdown();
    updateQuickSignatureDropdown();

    showSuccessMessage('Signature deleted: ' + name);
    console.log('Signature deleted:', name);

  } catch (error) {
    console.error('Error deleting signature:', error);
    alert('Error deleting signature: ' + error.message);
  }
}

/**
 * Show all saved signatures
 */
function manageSignaturesEnhanced() {
  try {
    const savedSignatures = JSON.parse(localStorage.getItem('savedSignatures') || '[]');

    if (savedSignatures.length === 0) {
      alert('No saved signatures.');
      return;
    }

    let list = savedSignatures
      .map((sig, i) => {
        const date = new Date(sig.createdAt).toLocaleDateString();
        return `${i + 1}. ${sig.name} (Created: ${date})`;
      })
      .join('\n');

    const index = prompt('Your saved signatures:\n\n' + list + '\n\nEnter number to load, or cancel:', '');
    
    if (index && savedSignatures[parseInt(index) - 1]) {
      loadSignatureEnhanced(savedSignatures[parseInt(index) - 1].name);
    }

  } catch (error) {
    console.error('Error managing signatures:', error);
    alert('Error managing signatures: ' + error.message);
  }
}

/**
 * Clear current signature
 */
function clearSignatureEnhanced() {
  if (!window.signaturePad) {
    alert('Signature pad not initialized.');
    return;
  }

  if (!window.signaturePad.isEmpty()) {
    if (confirm('Clear the current signature?')) {
      window.signaturePad.clear();
      showSuccessMessage('Signature cleared');
    }
  } else {
    alert('Canvas is already empty.');
  }
}

/**
 * Validate signature exists before preview
 */
function validateSignatureForPreview() {
  if (!window.signaturePad) {
    console.warn('Signature pad not initialized');
    return null;
  }

  if (window.signaturePad.isEmpty()) {
    return null; // No signature
  }

  try {
    const signatureData = window.signaturePad.toDataURL('image/png');
    if (!signatureData || signatureData.length < 100) {
      console.warn('Signature data appears invalid');
      return null;
    }
    return signatureData;
  } catch (error) {
    console.error('Error validating signature:', error);
    return null;
  }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  // Create alert div
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.role = 'alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';
  alertDiv.innerHTML = `
    <strong>Success!</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(alertDiv);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

/**
 * Export signatures as backup
 */
function exportSignaturesBackup() {
  try {
    const savedSignatures = JSON.parse(localStorage.getItem('savedSignatures') || '[]');
    
    if (savedSignatures.length === 0) {
      alert('No signatures to export.');
      return;
    }

    const dataStr = JSON.stringify(savedSignatures, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'signatures-backup-' + new Date().getTime() + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccessMessage('Signatures exported successfully');

  } catch (error) {
    console.error('Error exporting signatures:', error);
    alert('Error exporting signatures: ' + error.message);
  }
}

/**
 * Import signatures from backup
 */
function importSignaturesBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function(e) {
    try {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = function(event) {
        try {
          const imported = JSON.parse(event.target.result);
          
          if (!Array.isArray(imported)) {
            alert('Invalid backup file format.');
            return;
          }

          let savedSignatures = JSON.parse(localStorage.getItem('savedSignatures') || '[]');
          const originalCount = savedSignatures.length;

          // Merge with existing
          imported.forEach(sig => {
            if (!savedSignatures.find(s => s.name === sig.name)) {
              savedSignatures.push(sig);
            }
          });

          localStorage.setItem('savedSignatures', JSON.stringify(savedSignatures));
          
          updateSignatureDropdown();
          updateQuickSignatureDropdown();

          const added = savedSignatures.length - originalCount;
          showSuccessMessage(`Imported ${added} new signatures`);

        } catch (error) {
          alert('Error reading backup file: ' + error.message);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing signatures:', error);
      alert('Error importing signatures: ' + error.message);
    }
  };

  input.click();
}

// Make sure enhanced functions override the basic ones
// They will be called instead of the old ones if buttons use these names
window.saveSignature = saveSignatureEnhanced;
window.loadSignature = loadSignatureEnhanced;
window.deleteSignature = deleteSignatureEnhanced;
window.manageSignatures = manageSignaturesEnhanced;
window.clearSignature = clearSignatureEnhanced;
window.validateSignatureForPreview = validateSignatureForPreview;
