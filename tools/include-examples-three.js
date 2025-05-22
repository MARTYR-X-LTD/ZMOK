const path = require("path");

module.exports = function onNodeModuleFile(filePath) {
  const normalizedTarget = path.join("node_modules", "three", "examples");
  return filePath.includes(normalizedTarget);
};