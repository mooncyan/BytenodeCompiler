import Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";

import logger from "koa-logger";
import json from "koa-json";

import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

const app = new Koa();
const router = new Router();

function getElectronPath() {
  let electronExecPath = process.env.ELECTRON_EXEC_PATH || "";
  if (!electronExecPath) {
    const electronModulePath = path.dirname(require.resolve("electron"));
    const pathFile = path.join(electronModulePath, "path.txt");
    let executablePath;
    if (fs.existsSync(pathFile)) {
      executablePath = fs.readFileSync(pathFile, "utf-8");
    }
    if (executablePath) {
      electronExecPath = path.join(electronModulePath, "dist", executablePath);
      process.env.ELECTRON_EXEC_PATH = electronExecPath;
    } else {
      throw new Error("Electron uninstall");
    }
  }
  return electronExecPath;
}

function getBytecodeCompilerPath() {
  return path.resolve(process.cwd(), "node_modules", "electron-vite", "bin", "electron-bytecode.js");
}

function compileToBytecode(code) {
  return new Promise((resolve, reject) => {
    let data = Buffer.from([]);

    const electronPath = getElectronPath();
    const bytecodePath = getBytecodeCompilerPath();

    const proc = spawn(electronPath, [bytecodePath], {
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
app.use(json());
app.use(logger());
app.use(koaBody());

// Routes
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log("Koa started");
});
