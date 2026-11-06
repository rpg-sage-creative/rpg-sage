const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(__dirname, "..", "packages/@rsc-utils");
const packages = fs.readdirSync(baseDir)
    .filter(name => name !== "types" && fs.statSync(path.join(baseDir, name)).isDirectory());

function findDtsFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...findDtsFiles(fullPath));
        } else if (entry.endsWith(".d.ts")) {
            files.push(fullPath);
        }
    }
    return files;
}

function getExportedTypes(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const results = [];

    const lines = content.split("\n");
    for (const line of lines) {
        const match = line.match(/^\s*export\s+(type|interface)\s+(\w+)/);
        if (match) {
            results.push({ name: match[2], kind: match[1] });
        }
    }

    return [...new Set(results)];
}

const pkgExports = {};

for (const pkg of packages) {
    const buildDir = path.join(baseDir, pkg, "build");
    if (!fs.existsSync(buildDir)) continue;

    const dtsFiles = findDtsFiles(buildDir);

    for (const file of dtsFiles) {
        try {
            const types = getExportedTypes(file);
            if (types.length > 0) {
                const relPath = path.relative(
                    path.join(baseDir, "types"),
                    file.replace(/\.d\.ts$/, ".js")
                );

                if (!pkgExports[pkg]) pkgExports[pkg] = [];
                for (const t of types) {
                    pkgExports[pkg].push({ name: t.name, kind: t.kind, file: relPath });
                }
            }
        } catch(e) {}
    }
}

let output = "// Auto-generated aggregate type declarations for all @rsc-utils packages\n";
output += "// Only exports types and interfaces (no functions, constants, or classes)\n\n";

for (const [pkg, exports] of Object.entries(pkgExports)) {
    if (exports.length === 0) continue;

    output += `// ${pkg}\n`;

    const byFile = {};
    for (const e of exports) {
        if (!byFile[e.file]) byFile[e.file] = [];
        byFile[e.file].push(e.name);
    }

    for (const [file, names] of Object.entries(byFile)) {
        output += `export type { ${names.join(", ")} } from "${file}";\n`;
    }
    output += "\n";
}

fs.writeFileSync(path.join(baseDir, "types", "index.d.ts"), output);
console.log("Generated types.d.ts");
