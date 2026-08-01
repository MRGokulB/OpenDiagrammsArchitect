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
    const filePath = path.join(workspaceDir, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(workspaceDir)) return Response.json({ error: "Invalid path" }, { status: 403 });

    await fs.unlink(filePath);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// fetching file CONTENT natively
export async function PUT(request) {
  try {
    const { filename } = await request.json();
    if (!filename) return Response.json({ error: "No file provided" }, { status: 400 });

    const workspaceDir = await getWorkspaceDir();
    const filePath = path.join(workspaceDir, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(workspaceDir)) return Response.json({ error: "Invalid path" }, { status: 403 });

    const content = await fs.readFile(filePath, "utf8");
    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
