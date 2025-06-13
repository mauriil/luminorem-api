export declare class FileService {
    private readonly uploadsDir;
    private readonly logger;
    constructor();
    downloadImage(url: string, filename: string): Promise<string>;
    downloadVideo(videoUrl: string, filename: string): Promise<void>;
    createBoomerang(inputPath: string, outputPath: string): Promise<void>;
    generateFilename(guideName: string, type: string, extension: string): string;
    deleteFile(filename: string): Promise<void>;
    fileExists(filePath: string): boolean;
    getFileUrl(filename: string): string;
}
