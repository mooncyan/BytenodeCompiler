"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa_body_1 = __importDefault(require("koa-body"));
const koa_logger_1 = __importDefault(require("koa-logger"));
const koa_json_1 = __importDefault(require("koa-json"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_child_process_1 = require("node:child_process");
const app = new koa_1.default();
const router = new koa_router_1.default();
function getElectronPath() {
    let electronExecPath = process.env.ELECTRON_EXEC_PATH || "";
    if (!electronExecPath) {
        const electronModulePath = node_path_1.default.dirname(require.resolve("electron"));
        const pathFile = node_path_1.default.join(electronModulePath, "path.txt");
        let executablePath;
        if (node_fs_1.default.existsSync(pathFile)) {
            executablePath = node_fs_1.default.readFileSync(pathFile, "utf-8");
        }
        if (executablePath) {
            electronExecPath = node_path_1.default.join(electronModulePath, "dist", executablePath);
            process.env.ELECTRON_EXEC_PATH = electronExecPath;
        }
        else {
            throw new Error("Electron uninstall");
        }
    }
    return electronExecPath;
}
function getBytecodeCompilerPath() {
    return node_path_1.default.resolve(process.cwd(), "node_modules", "electron-vite", "bin", "electron-bytecode.js");
}
function compileToBytecode(code) {
    return new Promise((resolve, reject) => {
        let data = Buffer.from([]);
        const electronPath = getElectronPath();
        const bytecodePath = getBytecodeCompilerPath();
        const proc = (0, node_child_process_1.spawn)(electronPath, [bytecodePath], {
            env: { ELECTRON_RUN_AS_NODE: "1" },
            stdio: ["pipe", "pipe", "pipe", "ipc"],
        });
        if (proc.stdin) {
            proc.stdin.write(code);
            proc.stdin.end();
        }
        if (proc.stdout) {
            proc.stdout.on("data", (chunk) => {
                data = Buffer.concat([data, chunk]);
            });
            proc.stdout.on("error", (err) => {
                console.error(err);
            });
            proc.stdout.on("end", () => {
                resolve(data);
            });
        }
        if (proc.stderr) {
            proc.stderr.on("data", (chunk) => {
                console.error("Error: ", chunk.toString());
            });
            proc.stderr.on("error", (err) => {
                console.error("Error: ", err);
            });
        }
        proc.addListener("message", (message) => console.log(message));
        proc.addListener("error", (err) => console.error(err));
        proc.on("error", (err) => reject(err));
        proc.on("exit", () => {
            resolve(data);
        });
    });
}
// Hello world
router.post("/compile", async (ctx, next) => {
    console.log(ctx.request.body);
    ctx.body = await compileToBytecode(ctx.request.body);
    await next();
});
// Middlewares
app.use((0, koa_json_1.default)());
app.use((0, koa_logger_1.default)());
app.use((0, koa_body_1.default)());
// Routes
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000, () => {
    console.log("Koa started");
});
