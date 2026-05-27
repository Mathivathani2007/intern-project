import { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from './firebase';

const Gallery = ({ user }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaList, setMediaList] = useState([]);
  const [message, setMessage] = useState('');

  const fetchMedia = async () => {
    if (!user) return;
    try {
      const listRef = ref(storage, `users/${user.uid}/media`);
      const res = await listAll(listRef);
      const urls = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { url, name: itemRef.name };
        })
      );
      setMediaList(urls);
    } catch (error) {
      console.error("Error fetching media", error);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [user]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = () => {
    if (files.length === 0) {
      showMessage("Please select a file first!");
      return;
    }

    setUploading(true);
    
    // Upload all selected files
    files.forEach((file) => {
      const storageRef = ref(storage, `users/${user.uid}/media/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(prog);
        },
        (error) => {
          showMessage(`Upload failed: ${error.message}`);
          setUploading(false);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            showMessage("File uploaded successfully!");
            setUploading(false);
            setProgress(0);
            fetchMedia(); // Refresh gallery
          });
        }
      );
    });
  };

  const isVideo = (filename) => {
    return filename.match(/\.(mp4|webm|ogg)$/i);
  };

  return (
    <div className="card large" style={{ marginTop: '2rem' }}>
      <h2>Media Gallery</h2>
      <p className="subtitle">Upload and view your images and videos.</p>

      {message && <div style={{ color: '#FBBC05', marginBottom: '1rem' }}>{message}</div>}

      <div className="form-group">
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*" 
          onChange={handleFileChange} 
          style={{ marginBottom: '1rem' }}
        />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? `Uploading ${progress}%` : "Upload Files"}
        </button>
      </div>

      <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        {mediaList.map((media, index) => (
          <div key={index} style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            {isVideo(media.name) ? (
              <video src={media.url} controls style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            ) : (
              <img src={media.url} alt={media.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            )}
            <p style={{ fontSize: '0.8rem', padding: '0.5rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {media.name}
            </p>
          </div>
        ))}
        {mediaList.length === 0 && <p>No media uploaded yet.</p>}
      </div>
    </div>
  );
};

export default Gallery;
