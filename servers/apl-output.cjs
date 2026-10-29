/** Remove a request-specific function-result marker without changing user data. */
function extractAplFunctionResult(output, marker) {
    const lines = output.split('\n');
    const metadata = lines.find(line => line.trimStart().startsWith(marker));
    let aplFunctionTree;
    if (metadata) {
        try { aplFunctionTree = JSON.parse(metadata.trimStart().slice(marker.length)); } catch {}
    }
    return {
        output: lines.filter(line => !line.trimStart().startsWith(marker)).join('\n'),
        isAplFunction: metadata !== undefined,
        ...(aplFunctionTree ? { aplFunctionTree } : {})
    };
}

module.exports = { extractAplFunctionResult };
