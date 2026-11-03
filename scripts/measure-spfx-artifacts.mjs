import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const example = resolve(root, "examples/spfx124-webpart");
const assetDir = resolve(example, "release/assets");
const solutionDir = resolve(example, "sharepoint/solution");
const [assetNames, webPartPackage, libraryPackage, solutionConfig, solutionNames] = await Promise.all([
  readdir(assetDir),
  readFile(resolve(example, "package.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "packages/sharepoint-ui/package.json"), "utf8").then(JSON.parse),
  readFile(resolve(example, "config/package-solution.json"), "utf8").then(JSON.parse),
  readdir(solutionDir),
]);
const bundleNames = assetNames.filter(name => /^library-demo-web-part_[a-f\d]+\.js$/i.test(name));
const packageNames = solutionNames.filter(name => name.endsWith(".sppkg"));
if (bundleNames.length !== 1) throw new Error(`Expected one hashed library-demo web-part bundle in ${assetDir}; found ${bundleNames.length}.`);
if (packageNames.length !== 1) throw new Error(`Expected one SharePoint solution package in ${solutionDir}; found ${packageNames.length}.`);
const bundlePath = resolve(assetDir, bundleNames[0]);
const packagePath = resolve(solutionDir, packageNames[0]);
const [bundle, packageInfo] = await Promise.all([readFile(bundlePath), stat(packagePath)]);
const features = solutionConfig.solution?.features;
if (!features?.length) throw new Error("SPFx solution config does not contain any features.");

console.log(JSON.stringify({
  measuredOn: new Date().toISOString().slice(0, 10),
  webPartVersion: webPartPackage.version,
  libraryVersion: libraryPackage.version,
  solutionVersion: solutionConfig.solution.version,
  featureVersions: features.map(feature => feature.version),
  sppkg: { file: packageNames[0], bytes: packageInfo.size },
  demoBundle: {
    file: bundleNames[0],
    rawBytes: bundle.length,
    gzipBytes: gzipSync(bundle).length,
    brotliBytes: brotliCompressSync(bundle).length,
  },
  caveat: "The .sppkg size is its on-disk archive size. Demo bundle compression is measured independently and excludes other client assets and SharePoint host cost.",
}, null, 2));
