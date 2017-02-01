const fs = require('fs');       // File system module
const path = require('path');   // Path module

const loadFile = (request, response, fileName, fileType) => {
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

    const total = stats.size;
    const positions = range.replace(/bytes=/, '').split('-').map(Number);
    const end = positions[1] || total - 1;
    const start = positions[0] > end ? end - 1 : positions[0];
    const chunksize = (end - start) + 1;

    // Successful response to client
    response.writeHead(206, {
      'Content-Range': `bytes  ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': fileType,
    });

    // Get video in range
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
