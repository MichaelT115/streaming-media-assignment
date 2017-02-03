const fs = require('fs');       // File system module
const path = require('path');   // Path module

// Maps extensions to content-types
const extToType = {
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.html': 'text/html',
};

// Finds the file
const findFile = filePath => new Promise((resolve, reject) => {
  fs.stat(filePath, (err, stats) => {
    // If there is an error, reject
    if (err) {
      reject(err);
    }

    // If it succeeds, resolve with stats
    resolve(stats);
  });
});

// Creates a function that accepts a request, response, and file path.
// That function creates a promise that receives a stats of a file to make a reasponse stream
const createResponseStream = (request, response, filePath) => stats => new Promise(() => {
  // Find byte range
  const range = request.headers.range;
  // If there is no byte range
  if (!range) {
    return response.writeHead(416); // 416 Error: Requested Range no Satisfiable
  }

  const total = stats.size;   // Stores size of file
  const positions = range.replace(/bytes=/, '').split('-').map(Number);   // Stores the start and end point of the bytes wanted from the file
  const end = positions[1] || total - 1;  // Sets end point
  const start = positions[0] > end ? end - 1 : positions[0];  // Sets start point
  const chunkSize = (end - start) + 1;    // Gets total size

  const fileExt = path.extname(filePath); // Gets the file extension

  // Write response header
  response.writeHead(206, // 206 Success: Has sent partial content
    {
      'Content-Range': `bytes  ${start}-${end}/${total}`,   // How many bytes are being sent
      'Accept-Ranges': 'bytes',                             // Tells the browser to expect bytes
      'Content-Length': chunkSize,                          // Tells the browser how many bytes there are
      'Content-Type': extToType[fileExt],                   // Tells the browser the encodeing type
    });


  // Get stream to media
  const stream = fs.createReadStream(filePath, { start, end });

  // Send video stream
  stream.on('open', () => {
    stream.pipe(response);
  });

  // On error, end stream
  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  // Return the stream
  return stream;
});


// Creates a promise to load a file
const loadFile2 = (request, response, fileName) => new Promise(() => {
  // Find file
  const filePath = path.resolve(__dirname, fileName);

  findFile(filePath)  // Finds the file
    // If sucessful, create the response stream
    .then(createResponseStream(request, response, filePath))
    // If unsucessful, send error response
    .catch((err) => {
      // If the file could not be found
      if (err.code === 'ENOENT') {
        response.writeHead(404);  // 404 Error: Could not find requested file
      }

      // Return the error response
      return response.end(err);
    });
});

// Simply loads a file
const loadFile = (request, response, fileName) => {
  // Find file
  const filePath = path.resolve(__dirname, fileName);

  fs.stat(filePath, (err, stats) => {
    // If there is an error
    if (err) {
      // If the file could not be found
      if (err.code === 'ENOENT') {
        response.writeHead(404);  // 404 Error: Could not find requested file
      }

      // Return the error response
      return response.end(err);
    }

    // Find byte range
    const range = request.headers.range;
    // If there is no byte range
    if (!range) {
      return response.writeHead(416); // 416 Error: Requested Range no Satisfiable
    }

    const total = stats.size;   // Stores size of file
    const positions = range.replace(/bytes=/, '').split('-').map(Number);   // Stores the start and end point of the bytes wanted from the file
    const end = positions[1] || total - 1;  // Sets end point
    const start = positions[0] > end ? end - 1 : positions[0];  // Sets start point
    const chunkSize = (end - start) + 1;    // Gets total size

    const fileExt = path.extname(filePath); // Gets the file extension

    // Write response header
    response.writeHead(206, // 206 Success: Has sent partial content
      {
        'Content-Range': `bytes  ${start}-${end}/${total}`,   // How many bytes are being sent
        'Accept-Ranges': 'bytes',                             // Tells the browser to expect bytes
        'Content-Length': chunkSize,                          // Tells the browser how many bytes there are
        'Content-Type': extToType[fileExt],                   // Tells the browser the encodeing type
      });

    // Get stream to media
    const stream = fs.createReadStream(filePath, { start, end });

    // Send video stream
    stream.on('open', () => {
      stream.pipe(response);
    });

    // On error, end stream
    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    // Return the stream
    return stream;
  });
};

// Send party file
const getParty = (request, response) => {
  loadFile2(request, response, '../client/party.mp4');
};

// Send Bling file
const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3');
};

// Send bird file
const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4');
};


// Attach functions to exports
module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
