export function readImageDimensions(buf) {
    if (buf.length < 4)
        return null;
    // PNG: the IHDR chunk puts width and height as big-endian uint32 at 16..23.
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        if (buf.length < 24)
            return null;
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
    }
    // JPEG: walk the segment chain to the first start-of-frame, which carries
    // height at +5 and width at +7. 0xC4 (DHT), 0xC8 and 0xCC share the 0xCn range
    // without being frame headers, hence the three separate ranges.
    if (buf[0] === 0xff && buf[1] === 0xd8) {
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        let offset = 2;
        while (offset + 9 < buf.length) {
            if (buf[offset] !== 0xff)
                return null;
            // A marker may be preceded by any number of 0xFF fill bytes (ITU-T T.81
            // B.1.1.2). Skipping them matters for more than tidiness: reading the fill
            // byte AS the marker desynchronises the walk, the next getUint16 reads
            // payload as a segment length, and the whole thing returns null — which,
            // for a size guard, is a bypass rather than a parse failure.
            while (offset + 1 < buf.length && buf[offset + 1] === 0xff)
                offset++;
            if (offset + 9 >= buf.length)
                return null;
            const marker = buf[offset + 1];
            const length = view.getUint16(offset + 2, false);
            if (length < 2)
                return null;
            if ((marker >= 0xc0 && marker <= 0xc3) ||
                (marker >= 0xc5 && marker <= 0xc7) ||
                (marker >= 0xc9 && marker <= 0xcb) ||
                (marker >= 0xcd && marker <= 0xcf)) {
                return {
                    width: view.getUint16(offset + 7, false),
                    height: view.getUint16(offset + 5, false)
                };
            }
            offset += 2 + length;
        }
    }
    return null;
}
