const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

admin.initializeApp();

exports.getM3UFile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Fetch the file from Firebase Storage
      const fileUrl = 'https://firebasestorage.googleapis.com/v0/b/movie-sites-b3d76.appspot.com/o/Channels%2Flist_5ec43d8fb006a01077a25e6976145d3f_iptvlister.com.m3u8?alt=media&token=8441e344-370d-443a-be6b-a2841da24ee6';
      
      const response = await fetch(fileUrl);
      const data = await response.text();

      // Return the file with proper CORS headers
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', 'application/x-mpegURL');
      return res.status(200).send(data);
    } catch (error) {
      console.error('Error fetching the M3U file:', error);
      return res.status(500).send('Error fetching the M3U file.');
    }
  });
});
