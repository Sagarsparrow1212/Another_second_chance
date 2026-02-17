// Socket.IO service to avoid circular dependencies

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

module.exports = {
  setIO,
  getIO,
};