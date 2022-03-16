import FileRepositoryCache from "@plugin/File/FileRepositoryCache";
import {
    Context,
    ContextDeclaration,
    File
} from "@plugin/File/Definitions";

/**
 * Override's to add in custom contextCounter on context registration methods.
 */
export default class FileRepositoryCacheTest extends FileRepositoryCache
{
    public contextCounter:number = 0;

    public get projectFiles()
    {
        return this.projectFilesMap;
    }

    registerSource( path: string, text: string, file: File ): File
    {
        this.contextCounter++;
        return super.registerSource( path, text, file );
    }

    registerDeclaration( path: string, contextPath: string, context: ContextDeclaration )
    {
        this.contextCounter++;
        super.registerDeclaration( path, contextPath, context );
    }

    registerIncompleteContext( path: string, contextPath: string )
    {
        this.contextCounter++;
        super.registerIncompleteContext( path, contextPath );
    }

    registerTextWithContextPath( contextPath: string, text: string )
    {
        this.contextCounter++;
        super.registerTextWithContextPath( contextPath, text );
    }
}