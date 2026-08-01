import fs from "fs/promises";
import path from "path";

const getWorkspaceDir = async () => {
  const workspaceDir = path.join(process.cwd(), "workspace");
  try {
    await fs.access(workspaceDir);
  } catch {
    await fs.mkdir(workspaceDir, { recursive: true });
  }
  return workspaceDir;
};

const resolveWorkspaceFile = (workspaceDir, filename) => {
  const filePath = path.resolve(workspaceDir, filename);
  const workspaceRoot = path.resolve(workspaceDir);

  if (!filePath.startsWith(`${workspaceRoot}${path.sep}`)) {
    throw new Error("Invalid path");
  }

  return filePath;
};

// fetching all files
export async function GET() {
  try {
    const workspaceDir = await getWorkspaceDir();
    const files = await fs.readdir(workspaceDir);
    
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(workspaceDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          time: stats.mtimeMs,
          size: stats.size
        };
      })
    );
    
    // Sort by latest
    fileStats.sort((a, b) => b.time - a.time);
    return Response.json({ files: fileStats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// creating files (Existing logical structure upgraded)
export async function POST(request) {
  try {
    const { content, filename, extension, encoding, exactName } = await request.json();
    const workspaceDir = await getWorkspaceDir();

    let finalName = exactName;
    if (!finalName) {
      const safeFilename = filename.replace(/[^a-z0-9_-]/gi, '_');
      finalName = `${safeFilename}_${Date.now()}.${extension}`;
    }
    const filePath = path.join(workspaceDir, finalName);

    if (encoding === "base64") {
      const base64Data = content.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(filePath, base64Data, 'base64');
    } else {
      await fs.writeFile(filePath, content, 'utf8');
    }

    return Response.json({ success: true, path: filePath, name: finalName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Delete functionality
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");
    if (!filename) return Response.json({ error: "No file provided" }, { status: 400 });

    const workspaceDir = await getWorkspaceDir();
    const filePath = resolveWorkspaceFile(workspaceDir, filename);

    // Prevent directory traversal
    await fs.unlink(filePath);
    return Response.json({ success: true });
  } catch (error) {
    const status = error.message === "Invalid path" ? 403 : 500;
    return Response.json({ error: error.message }, { status });
  }
}

// Rename workspace file
export async function PATCH(request) {
  try {
    const { from, to } = await request.json();
    if (!from || !to) return Response.json({ error: "Missing filename" }, { status: 400 });

    const workspaceDir = await getWorkspaceDir();
    const nextName = to.endsWith(".mmd") ? to : `${to}.mmd`;

    if (path.basename(from) !== from || path.basename(nextName) !== nextName) {
      return Response.json({ error: "Invalid filename" }, { status: 403 });
    }

    const oldPath = resolveWorkspaceFile(workspaceDir, from);
    const newPath = resolveWorkspaceFile(workspaceDir, nextName);

    try {
      await fs.access(newPath);
      return Response.json({ error: "A file with that name already exists" }, { status: 409 });
    } catch {
      await fs.rename(oldPath, newPath);
    }

    return Response.json({ success: true, name: nextName });
  } catch (error) {
    const status = error.message === "Invalid path" ? 403 : 500;
    return Response.json({ error: error.message }, { status });
  }
}

// fetching file CONTENT natively
export async function PUT(request) {
  try {
    const { filename } = await request.json();
    if (!filename) return Response.json({ error: "No file provided" }, { status: 400 });

    const workspaceDir = await getWorkspaceDir();
    const filePath = resolveWorkspaceFile(workspaceDir, filename);

    // Prevent directory traversal
    const content = await fs.readFile(filePath, "utf8");
    return Response.json({ content });
  } catch (error) {
    const status = error.message === "Invalid path" ? 403 : 500;
    return Response.json({ error: error.message }, { status });
  }
}
