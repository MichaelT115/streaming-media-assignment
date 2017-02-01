const fs = require('fs');       // File system module
const path = require('path');   // Path module

// Send the media file
const getParty = (request, response) => {
  // Find the media file
  const file = path.resolve(__dirname, '../client/party.mp4');

  // Get file
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
      'Content-Type': 'video/mp4',
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

module.exports.getParty = getParty;
