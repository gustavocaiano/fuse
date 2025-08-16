"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const cameras_1 = require("./routes/cameras");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API routes
app.use('/api/cameras', cameras_1.cameraRouter);
// Serve HLS output static directory
const hlsDir = path_1.default.resolve(process.env.HLS_DIR || path_1.default.join(__dirname, 'hls'));
app.use('/hls', express_1.default.static(hlsDir, {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
    console.log(`cam-parser server listening on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map