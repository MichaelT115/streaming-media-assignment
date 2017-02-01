const fs = require('fs');       // File system module
const path = require('path');   // Path module

const loadFile = (request, response, fileName, fileType) => {
  // Find file
  const file = path.resolve(__dirname, fileName);

  fs.stat(file, (err, stats) => {
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

    // Get positions
    // "bytes=0000-0001" becomes: ["0000", "0001"]
    const positions = range.replace(/bytes=/, '').split('-');

    // Get start of byte range
    let start = parseInt(positions[0], 10);

    // Get end of byte range
    // This is either defined in the range or is the last byte.
    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    // In case the start exceeds the end, set the start to one before the end.
    if (start > end) {
      start = end - 1;
    }

    // Size in bytes of what is send back to the client
    const chunksize = (end - start) + 1;

    // Successful response to client
    response.writeHead(206, {
      'Content-Range': `bytes  ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': fileType,
    });

    // Get video in range
    const stream = fs.createReadStream(file, { start, end });

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
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};


module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
