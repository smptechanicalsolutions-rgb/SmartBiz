/**
 * Google Drive Integration for Certificate Upload
 * This module handles authentication and file uploads to Google Drive
 */

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // Replace with your OAuth 2.0 Client ID
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let googleAuth = null;
let googleAuthInitialized = false;

/**
 * Initialize Google API and render sign-in button
 */
function initializeGoogleDrive() {
  gapi.load('auth2', function() {
    gapi.auth2.init({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES.join(' ')
    }).then(function(auth) {
      googleAuth = auth;
      googleAuthInitialized = true;
      renderGoogleSignIn();
      
      // Check if user is already signed in
      if (auth.isSignedIn.get()) {
        updateGoogleAuthStatus(true);
      } else {
        updateGoogleAuthStatus(false);
      }
      
      // Listen for sign-in state changes
      auth.isSignedIn.listen(isSignedIn => {
        updateGoogleAuthStatus(isSignedIn);
      });
    }).catch(function(error) {
      console.error('Google API initialization failed:', error);
      updateGoogleAuthStatus(false, 'Failed to initialize Google Drive');
    });
  });
}

/**
 * Render Google Sign-In button
 */
function renderGoogleSignIn() {
  const container = document.getElementById('googleSignInContainer');
  if (!container) return;
  
  // Create a simple sign in/out button
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'googleAuthBtn';
  button.className = 'btn btn-outline-success btn-sm';
  button.innerHTML = '🔐 Sign in with Google Drive';
  
  button.onclick = function() {
    if (googleAuth && !googleAuth.isSignedIn.get()) {
      googleAuth.signIn();
    } else if (googleAuth && googleAuth.isSignedIn.get()) {
      googleAuth.signOut();
    }
  };
  
  container.innerHTML = '';
  container.appendChild(button);
}

/**
 * Update Google authentication status display
 */
function updateGoogleAuthStatus(isSignedIn, message = null) {
  const statusElement = document.getElementById('googleAuthStatus');
  const authBtn = document.getElementById('googleAuthBtn');
  
  if (!statusElement || !authBtn) return;
  
  if (isSignedIn) {
    const user = googleAuth.currentUser.get();
    const profile = user.getBasicProfile();
    statusElement.innerHTML = `✅ Signed in as <strong>${profile.getName()}</strong> - Certificates will upload to Google Drive`;
    statusElement.className = 'text-success small';
    authBtn.innerHTML = '🚪 Sign out from Google Drive';
    authBtn.className = 'btn btn-outline-danger btn-sm';
  } else {
    statusElement.innerHTML = message || '⚠️ Not signed in - Please sign in to upload certificates to Google Drive';
    statusElement.className = 'text-warning small';
    authBtn.innerHTML = '🔐 Sign in with Google Drive';
    authBtn.className = 'btn btn-outline-success btn-sm';
  }
}

/**
 * Upload file to Google Drive and get shareable URL
 * @param {File} file - The file to upload
 * @param {string} fileName - Name for the file on Google Drive
 * @returns {Promise<{fileId: string, shareableUrl: string}>} - File ID and shareable URL
 */
async function uploadCertificateToGoogleDrive(file, fileName) {
  return new Promise((resolve, reject) => {
    // Check authentication
    if (!googleAuth || !googleAuth.isSignedIn.get()) {
      reject(new Error('Not signed in to Google Drive. Please sign in first.'));
      return;
    }
    
    // Prepare file metadata
    const metadata = {
      name: fileName,
      mimeType: file.type || 'application/octet-stream'
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    // Get access token
    const accessToken = googleAuth.currentUser.get().getAuthResponse().id_token;
    
    // Upload file to Google Drive
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({
        'Authorization': 'Bearer ' + googleAuth.currentUser.get().getAuthResponse().access_token
      }),
      body: form
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      const fileId = data.id;
      
      // Make file shareable
      makeFileShareable(fileId)
        .then(shareableUrl => {
          resolve({
            fileId: fileId,
            shareableUrl: shareableUrl
          });
        })
        .catch(error => {
          reject(error);
        });
    })
    .catch(error => {
      console.error('Upload error:', error);
      reject(error);
    });
  });
}

/**
 * Make a file shareable and return the shareable URL
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<string>} - Shareable URL
 */
async function makeFileShareable(fileId) {
  return new Promise((resolve, reject) => {
    // Update file permissions to be accessible via link
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': 'Bearer ' + googleAuth.currentUser.get().getAuthResponse().access_token,
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Permission update failed: ${response.statusText}`);
      }
      // Return the shareable URL
      const shareableUrl = `https://drive.google.com/file/d/${fileId}/view`;
      resolve(shareableUrl);
    })
    .catch(error => {
      console.error('Permission error:', error);
      reject(error);
    });
  });
}

/**
 * Check if Google Drive is authenticated
 * @returns {boolean} - True if authenticated
 */
function isGoogleDriveAuthenticated() {
  return googleAuth && googleAuth.isSignedIn.get();
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  // Add a small delay to ensure gapi is loaded
  setTimeout(initializeGoogleDrive, 500);
});
