import { Animation } from "konva/lib/Animation";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Layer, Rect, Stage, Transformer } from "react-konva";
import useRootContext from "../hooks/useRootContext";

const DraggableVideo = observer(function DraggableVideo({
    curVideo,
    transformerRef,
}) {
	const {
		uiStore,
	} = useRootContext();

    const imageRef = useRef(null);
    const [isSelected, setIsSelected] = useState(false);

    const videoElement = useMemo(() => {
        const element = document.createElement("video");
        element.src = curVideo.source;
		element.loop = true;
        return element;
    }, [curVideo.source]);

    const onLoadedMetadata = action(() => {
        const metadata = {
            duration: videoElement.duration,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
			scaleX: uiStore.canvasScale,
			scaleY: uiStore.canvasScale,
        };
        curVideo.setMetadata(metadata);
    });

    useEffect(() => {
        videoElement.addEventListener("loadedmetadata", onLoadedMetadata);
        return () => {
            videoElement.removeEventListener("loadedmetadata", onLoadedMetadata);
        };
    }, [videoElement]);

    const onCanPlay = () => {
        videoElement.muted = true;
        videoElement.play();
        //videoElement.muted = false;
        const layer = imageRef.current.getLayer();
        const anim = new Animation(() => {}, layer);
        anim.start();
        return () => anim.stop();
    };

	const onVideoDragEnd = action((event) => {
		curVideo.x = event.target.x();
		curVideo.y = event.target.y();
	});

	const onTransformerEnd = action((event) => {
		curVideo.scaleX = event.target.scaleX();
		curVideo.scaleY = event.target.scaleY();
		curVideo.x = event.target.x();
		curVideo.y = event.target.y();
	});

    useEffect(() => {
        videoElement.addEventListener("canplay", onCanPlay);
        return () => {
            videoElement.removeEventListener("canplay", onCanPlay);
        };
    }, [videoElement]);

    useEffect(() => {
        if (!isSelected) {
            transformerRef.current.detach();
			transformerRef.current.off("transformend");
        } else {
            transformerRef.current.nodes([imageRef.current]);
			transformerRef.current.on("transformend", onTransformerEnd);
        }
        transformerRef.current.getLayer().batchDraw();
    }, [isSelected, transformerRef]);

    return (
        <Image
            ref={imageRef}
            image={videoElement}
            stroke="black"
            x={uiStore.canvasSize.width / 2}
            y={uiStore.canvasSize.height / 2}
            width={curVideo.width}
            height={curVideo.height}
            offsetX={curVideo.width / 2}
            offsetY={curVideo.height / 2}
            scaleX={curVideo.scaleX}
            scaleY={curVideo.scaleY}
            draggable={isSelected}
            onDblClick={() => setIsSelected(!isSelected)}
			onDragEnd={onVideoDragEnd}
        />
    );
});

const EditorCanvas = observer(function EditorCanvas() {
    const transformerRef = useRef(null);

	const {
		uiStore,
		domainStore
	} = useRootContext();

    const projectWidth = domainStore.projectMetadata.width;
    const projectHeight = domainStore.projectMetadata.height;

    const onZoomChange = action((event) => {
        uiStore.canvasControls.scalePos = event.target.value;
    });

    const onBackgroundClick = () => {
        transformerRef.current.nodes([]);
    };

    useEffect(
        action(() => {
            const minWindowHeight = uiStore.canvasSize.height - uiStore.canvasConst.margin;
            const minWindowWidth = uiStore.canvasSize.width - uiStore.canvasConst.margin;
            while (
                (projectHeight * uiStore.canvasScale > minWindowHeight ||
                    projectWidth * uiStore.canvasScale > minWindowWidth) &&
                uiStore.canvasControls.scalePos > 0
            ) {
                uiStore.canvasControls.scalePos--;
            }
        }),
        [projectHeight, projectWidth]
    );

    return (
        <>
            <div>
                <label htmlFor="canvas_zoom"> Zoom {uiStore.canvasZoom} </label>
                <input
                    id="canvas_zoom"
                    type={"range"}
                    min={0}
                    max={10}
                    value={uiStore.canvasControls.scalePos}
                    onChange={onZoomChange}
                />
            </div>
            <Stage width={uiStore.canvasSize.width} height={uiStore.canvasSize.height}>
                <Layer>
                    <Rect
                        x={0}
                        y={0}
                        width={uiStore.canvasSize.width}
                        height={uiStore.canvasSize.height}
                        fill="red"
                        onClick={onBackgroundClick}
                    />
                    <Rect
                        x={uiStore.canvasSize.width / 2}
                        y={uiStore.canvasSize.height / 2}
                        width={projectWidth}
                        height={projectHeight}
                        offsetX={projectWidth / 2}
                        offsetY={projectHeight / 2}
                        fill="black"
                        scaleX={uiStore.canvasScale}
                        scaleY={uiStore.canvasScale}
                    />
                    <DraggableVideo
                        curVideo={domainStore.videos[0]}
                        transformerRef={transformerRef}
                    />
                    <Transformer
                        ref={transformerRef}
                        rotateAnchorOffset={60}
                        enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                    />
                </Layer>
            </Stage>
        </>
    );
});

export default EditorCanvas;
