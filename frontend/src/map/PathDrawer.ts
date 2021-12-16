import {RawMapEntity, RawMapEntityType} from "../api";
import {Theme} from "@mui/material";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

export class PathDrawer {
    static drawPath(type: "SVG" | "PNG", path: RawMapEntity, mapWidth: number, mapHeight: number, pixelSize: number, theme: Theme) : Promise<HTMLImageElement> {
        let createDataUrl: (points: Array<number>, type: RawMapEntityType, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) => string;

        if (type === "SVG") {
            createDataUrl = PathDrawer.createSVGDataUrlFromPoints;
        } else if (type === "PNG") {
            createDataUrl = PathDrawer.createPNGDataUrlFromPoints;
        }

        return new Promise((resolve, reject) => {
            if (!(path.type === RawMapEntityType.Path || path.type === RawMapEntityType.PredictedPath)) {
                return reject("Not a path");
            }
            const img = new Image();

            if (path.points.length > 0) {
                img.src = createDataUrl(path.points, path.type, mapWidth, mapHeight, pixelSize, theme);

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

    private static createSVGDataUrlFromPoints(points: Array<number>, type: RawMapEntityType, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) {
        let svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}"><path d="`;
        let pathColor;

        switch (theme.palette.mode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }

        for (let i = 0; i < points.length; i = i + 2) {
            let type = "L";

            if (i === 0) {
                type = "M";
            }

            svgPath += `${type} ${points[i] / pixelSize} ${points[i + 1] / pixelSize} `;
        }

        svgPath += `" fill="none" stroke="${pathColor}" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"`;

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/></svg>";

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgPath)}`;

    }

    private static createPNGDataUrlFromPoints(points: Array<number>, type: RawMapEntityType, mapWidth: number, mapHeight: number, pixelSize: number, theme : Theme) {
        if (!ctx) {
            return canvas.toDataURL();
        }

        if (canvas.width !== mapWidth || canvas.height !== mapHeight) {
            canvas.width = mapWidth;
            canvas.height = mapHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);


        let pathColor;
        switch (theme.palette.mode) {
            case "light":
                pathColor = "#ffffff";
                break;
            case "dark":
                pathColor = "#000000";
                break;
        }


        ctx.beginPath();
        ctx.imageSmoothingEnabled = false;
        ctx.lineWidth = 1;
        ctx.strokeStyle = pathColor;

        if (type === RawMapEntityType.PredictedPath) {
            ctx.setLineDash([1, 1]);
        } else {
            ctx.setLineDash([]);
        }


        ctx.moveTo( //This code is intentionally duplicated for performance reasons
            Math.round(points[0] / pixelSize) + 0.5,
            Math.round(points[1] / pixelSize) + 0.5
        );

        for (let i = 2; i < points.length; i = i+2) {
            //https://usefulangle.com/post/17/html5-canvas-drawing-1px-crisp-straight-lines
            const x = Math.round(points[i] / pixelSize) + 0.5;
            const y = Math.round(points[i+1] / pixelSize) + 0.5;

            ctx.lineTo(x, y);
        }
        ctx.stroke();

        return canvas.toDataURL();
    }
}
