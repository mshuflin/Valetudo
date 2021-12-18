import {RawMapEntity, RawMapEntityType} from "../api";
import {Theme} from "@mui/material";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

export class PathDrawer {
    static drawPaths(type: "SVG" | "PNG", paths: Array<RawMapEntity>, mapWidth: number, mapHeight: number, pixelSize: number, theme: Theme) : Promise<HTMLImageElement> {
        let createDataUrl: (paths: Array<RawMapEntity>, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) => string;


        if (type === "SVG") {
            createDataUrl = PathDrawer.createSVGDataUrlFromPaths;
        } else if (type === "PNG") {
            createDataUrl = PathDrawer.createPNGDataUrlFromPaths;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();

            if (paths.length > 0) {
                img.src = createDataUrl(paths, mapWidth, mapHeight, pixelSize, theme);

                img.decode().then(() => {
                    resolve(img);
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(img);
            }
        });
    }

    private static createSVGDataUrlFromPaths(paths: Array<RawMapEntity>, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}">`;
        let pathColor : string;

        switch (theme.palette.mode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }

        paths.forEach(path => {
            svg += PathDrawer.createSVGPathFromPoints(
                path.points.map(p => {
                    return p / pixelSize;
                }),
                path.type,
                pathColor
            );
        });

        svg += "</svg>";

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    private static createSVGPathFromPoints(points: Array<number>, type: RawMapEntityType, color: string) {
        let svgPath = "<path d=\"";

        for (let i = 0; i < points.length; i = i + 2) {
            let type = "L";

            if (i === 0) {
                type = "M";
            }

            svgPath += `${type} ${points[i]} ${points[i + 1]} `;
        }

        svgPath += `" fill="none" stroke="${color}" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"`;

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/>";

        return svgPath;
    }

    private static createPNGDataUrlFromPaths(paths: Array<RawMapEntity>, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) {
        if (!ctx) {
            return canvas.toDataURL();
        }

        if (canvas.width !== mapWidth || canvas.height !== mapHeight) {
            canvas.width = mapWidth;
            canvas.height = mapHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);


        let pathColor: string;
        switch (theme.palette.mode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }

        paths.forEach(path => {
            ctx.beginPath();
            ctx.imageSmoothingEnabled = false;
            ctx.lineWidth = 1;
            ctx.strokeStyle = pathColor;

            if (path.type === RawMapEntityType.PredictedPath) {
                ctx.setLineDash([1, 1]);
            } else {
                ctx.setLineDash([]);
            }


            ctx.moveTo( //This code is intentionally duplicated for performance reasons
                Math.round(path.points[0] / pixelSize) + 0.5,
                Math.round(path.points[1] / pixelSize) + 0.5
            );

            for (let i = 2; i < path.points.length; i = i+2) {
                //https://usefulangle.com/post/17/html5-canvas-drawing-1px-crisp-straight-lines
                const x = Math.round(path.points[i] / pixelSize) + 0.5;
                const y = Math.round(path.points[i+1] / pixelSize) + 0.5;

                ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        return canvas.toDataURL();
    }
}
