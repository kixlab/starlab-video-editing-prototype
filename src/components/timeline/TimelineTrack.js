import React, { forwardRef } from "react";

import { observer } from "mobx-react-lite";

import DraggableTimelineItem from "./DraggableTimelineItem";

import useRootContext from "../../hooks/useRootContext";
import EmptySpace from "./EmptySpace";

const TimelineTrack = observer(
    forwardRef(function TimelineTrack(
        { id, style, title, scenes, isOverlay, isOver, setActivatorNodeRef, listeners, attributes },
        ref
    ) {
        const { uiStore } = useRootContext();
        const width = uiStore.trackWidthPx;
        const handlerWidth = uiStore.timelineConst.trackHandlerWidth;
		scenes.sort((p1, p2) => p1.commonState.offset - p2.commonState.offset);
		const emptySpaces = scenes.map((value, idx) => {
			const lastEnd = idx === 0 ? 0 : scenes[idx - 1].commonState.end;
			let space = {
				offset: lastEnd,
				duration: value.commonState.offset - lastEnd,
				idx: idx,
				key: "empty_space_for_" + value.commonState.id,
			};
			return space;
		});

        return (
            <div
                ref={ref}
                id={id}
                className="flex flex-row flex-nowrap"
                style={{
                    ...style,
                    width: handlerWidth + width,
                    overflow: "visible",
                }}
            >
                <div
                    ref={setActivatorNodeRef}
                    className="my-2"
                    style={{
                        width: handlerWidth,
                        overflow: "hidden",
                    }}
                    {...listeners}
                    {...attributes}
                >
                    {" "}
                    {title}
                </div>
                <div
                    className={
                        isOverlay
                            ? "bg-slate-600 my-1 relative h-14"
                            : isOver
                            ? "bg-slate-500 my-1 relative h-14"
                            : "bg-slate-400 my-1 relative h-14"
                    }
                    style={{
                        width: width,
                    }}
                >
                    {scenes.map((scene) => (
                        <DraggableTimelineItem
                            key={scene.commonState.id}
                            scene={scene}
                            scenes={scenes}
                        />
                    ))}
					{emptySpaces.map((space) => (
						<EmptySpace
							key={space.key}
							space={space}
							scenes={scenes} />
					))}
                </div>
            </div>
        );
    })
);

export default TimelineTrack;
