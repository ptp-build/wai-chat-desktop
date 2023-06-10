# Wai Chat Desktop

Wai Chat Desktop by electron

###  - 发布


- change `package.json` > `version` to `1.0.1`


    VERSION=1.1.2
    git add . && git commit -m "Version ${VERSION} release"
    git tag -a v${VERSION} -m "Version ${VERSION} release"
    git push origin v${VERSION}
    git tag --list
