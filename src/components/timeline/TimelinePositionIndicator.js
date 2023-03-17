import React from "react";

import { observer } from "mobx-react-lite";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import useRootContext from "../../hooks/useRootContext";
import { playPositionToFormat } from "../../utilities/timelineUtilities";

const TimelinePositionIndicator = observer(function TimelinePositionIndicator({}) {
    const { uiStore } = useRootContext();

    const width = uiStore.trackWidthPx;
    const height = uiStore.timelineSize.height;
    const labelIntervalPx = uiStore.timelineConst.labelIntervalPx;

    const playPositionPx = uiStore.secToPx(uiStore.timelineControls.playPosition);
    const playIndicatorWidth = 8;

    const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
        id: "position_indicator",
    });

    const curPlayPosition =
        uiStore.timelineControls.playPosition + (typeof transform?.x === 'number' ? uiStore.pxToSec(transform.x) : 0);
    return (
        <>
            <div
                className={
                    isDragging ? "absolute z-20 bg-violet-500" : "absolute z-20 hover:bg-violet-500"
                }
                style={{
                    height: height,
                    left: playPositionPx - playIndicatorWidth / 2,
                    transform: CSS.Transform.toString(transform),
                }}
                ref={setNodeRef}
                {...listeners}
                {...attributes}
            >
                {isDragging ? (
                    <label
                        className="absolute z-30 bg-violet-800 text-white text-xs"
                        style={{
                            left: playIndicatorWidth,
                        }}
                        htmlFor="position_indicator_button"
                    >
                        {" "}
                        {playPositionToFormat(curPlayPosition)}{" "}
                    </label>
                ) : null}
                <button
                    type="button"
                    id="position_indicator_button"
                    style={{
                        width: playIndicatorWidth,
                        height: height,
                    }}
                >
                    <div
                        className="mx-auto"
                        style={{
                            width: 2,
                            height: height,
                            background: "black",
                        }}
                    />
                </button>
            </div>
        </>
    );
});

export default TimelinePositionIndicator;