   
cmd

    sips -z 16 16     favicon.512x512.png --out favicon.iconset/icon_16x16.png
    sips -z 32 32     favicon.512x512.png --out favicon.iconset/icon_16x16@2x.png
    sips -z 32 32     favicon.512x512.png --out favicon.iconset/icon_32x32.png
    sips -z 64 64     favicon.512x512.png --out favicon.iconset/icon_32x32@2x.png
    sips -z 128 128   favicon.512x512.png --out favicon.iconset/icon_128x128.png
    sips -z 256 256   favicon.512x512.png --out favicon.iconset/icon_128x128@2x.png
    sips -z 256 256   favicon.512x512.png --out favicon.iconset/icon_256x256.png
    sips -z 512 512   favicon.512x512.png --out favicon.iconset/icon_256x256@2x.png
    sips -z 512 512   favicon.512x512.png --out favicon.iconset/icon_512x512.png
    
    
    sips -z 256 256   favicon.512x512.png --out favicon.256x256.png
    sips -z 256 256   favicon.512x512.png --out favicon.256x256.png
    sips -z 256 256   favicon.512x512.png --out favicon.png
    

    iconutil -c icns favicon.iconset
