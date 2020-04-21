#!/bin/bash

# Directory with .deb files
OUTDIR=$(pwd)/out
# Base image for building
BASEIMAGE=debian:buster
# Current user - to make current user owner of output .deb files.
FILE_OWNER=$(id -u):$(id -g)

IMAGE_TAG=deb-build-web:$DRONE_BUILD_NUMBER

echo "Building $BASEIMAGE based image into $OUTDIR"
docker build -f drakcore/package/Dockerfile \
	     --build-arg IMAGE=$BASEIMAGE \
             -t $IMAGE_TAG . && \
docker run --rm \
           -it \
           -v $OUTDIR:/out \
           $IMAGE_TAG \
           sh -c "dpkg-buildpackage -us -uc -b && cp ../drakcore*.deb /out && chown -R $FILE_OWNER /out"

if [ $? -ne 0 ]; then echo Failed to build package ; exit 1 ; fi

echo Verifying package existence...
find $OUTDIR
