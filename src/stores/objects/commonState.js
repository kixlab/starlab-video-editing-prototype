import { makeAutoObservable } from "mobx";
import { groundCoordinate, roundNumber } from "../../utilities/genericUtilities";

class CommonState {
    processing = false;
    id = "test";

    thumbnails = ["edit"];

    start = 0; // start after trimming relative to video
    finish = 0; // finish after trimming relative to video
    duration = 0; // total duration (should not change)
    offset = 0; // offset relative to timeline
    speed = 1;

    x = 0;
    y = 0;
    z = 0;
    width = 200;
    height = 100;
    scaleX = 1;
    scaleY = 1;
    rotation = 0; //deg

    animation = {};
    filterMap = {
		opacity: 1,
		brightness: 1,
		blur: 0,
	};

    transitionStart = {};
    transitionEnd = {};

	trackId = 0;

    constructor(domainStore, object, id, trackId) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.domainStore = domainStore;
		this.object = object;
        this.id = id;
        this.processing = true;
        this.trackId = trackId;
    }

    setMetadata(metadata) {
        this.thumbnails = metadata.thumbnails !== undefined ? metadata.thumbnails : this.thumbnails;
        this.start = metadata.start !== undefined ? metadata.start : this.start;
        this.duration = metadata.duration !== undefined ? metadata.duration : this.duration;
        this.finish = metadata.finish !== undefined ? metadata.finish : this.finish;
        this.offset = metadata.offset !== undefined ? metadata.offset : this.offset;
        this.speed = metadata.speed !== undefined ? metadata.speed : this.speed;

        this.x = metadata.x !== undefined ? metadata.x : this.x;
        this.y = metadata.y !== undefined ? metadata.y : this.y;
        this.z = metadata.z !== undefined ? metadata.z : this.z;
        this.width = metadata.width !== undefined ? metadata.width : this.width;
        this.height = metadata.height !== undefined ? metadata.height : this.height;
        this.scaleX = metadata.scaleX !== undefined ? metadata.scaleX : this.scaleX;
        this.scaleY = metadata.scaleY !== undefined ? metadata.scaleY : this.scaleY;
        this.rotation = metadata.rotation !== undefined ? metadata.rotation : this.rotation;

        this.animation = metadata.animation !== undefined ? 
			{ ...this.animation, ...metadata.animation } : this.animation;
        this.filterMap = metadata.filterMap !== undefined ? 
			{ ...this.filterMap, ...metadata.filterMap } : this.filterMap;

        this.transitionStart = {};
        this.transitionEnd = {};

        this.trackId = metadata.trackId !== undefined ? metadata.trackId : this.trackId;

        this.processing = metadata.processing !== undefined ? metadata.processing : this.processing;

        if (this.end >= this.domainStore.projectMetadata.duration) {
            this.domainStore.projectMetadata.duration = this.end;
			this.domainStore.rootStore.uiStore.timelineConst.trackMaxDuration = this.end;
        }
    }

    onDragMove(target) {
		const projectWidth = this.domainStore.projectMetadata.width;
		const projectHeight = this.domainStore.projectMetadata.height;
		const canvasWidth = this.domainStore.rootStore.uiStore.canvasSize.width;
		const canvasHeight = this.domainStore.rootStore.uiStore.canvasSize.height;
		if (this.object.title === "Text"
			|| this.object.title === "Image"
		) {
			this.x = roundNumber(groundCoordinate(target.x(), target.width(), projectWidth, canvasWidth), 0);
        	this.y = roundNumber(groundCoordinate(target.y(), target.height(), projectHeight, canvasHeight), 0);
		}
		// target.setAttrs({
		// 	x: this.x,
		// 	y: this.y,
		// });
    }

    onTransform(target) {
		const minWidth = this.domainStore.rootStore.uiStore.canvasConst.minWidth;
		const projectWidth = this.domainStore.projectMetadata.width;
		const projectHeight = this.domainStore.projectMetadata.height;
		const canvasWidth = this.domainStore.rootStore.uiStore.canvasSize.width;
		const canvasHeight = this.domainStore.rootStore.uiStore.canvasSize.height;

		if (this.object.title === "Text"
			|| this.object.title === "Image"
		) {
			const newWidth = Math.max(target.width() * target.scaleX(), minWidth);
			const newHeight = Math.max(target.height() * target.scaleY(), minWidth);
			
			this.width = roundNumber(newWidth, 0);
			this.height = roundNumber(newHeight, 0);

			this.x = roundNumber(groundCoordinate(target.x(), newWidth, projectWidth, canvasWidth), 0);
        	this.y = roundNumber(groundCoordinate(target.y(), newHeight, projectHeight, canvasHeight), 0);
		

			this.scaleX = 1;
			this.scaleY = 1;
		}
		this.rotation = roundNumber(target.rotation(), 0);

		target.setAttrs({
			scaleX: this.scaleX,
			scaleY: this.scaleY,
			width: this.width,
			height: this.height,
			rotation: this.rotation,
			x: target.x(),
			y: target.y(),
		});
    }

    offsetToNative(timestamp) {
        const native = timestamp - this.offset + this.start;
        return native;
    }

	splitObject(offsetTimestamp) {
        const nativeTimestamp = this.offsetToNative(offsetTimestamp);
        const right = this.object.getDeepCopy();
		const left = this.object.getDeepCopy();

        right.commonState.setMetadata({
            offset: offsetTimestamp,
            start: nativeTimestamp,
        });
        left.commonState.setMetadata({
            finish: nativeTimestamp,
        });

		console.log(left.commonState.id, right.commonState.id);
		return {
			left,
			right
		};
	}

	isVisible(playPosition) {
        return (this.offset <= playPosition &&
        	this.end > playPosition);
	}

	get isVisibleOnCanvas() {
		return this.isVisible(this.domainStore.rootStore.uiStore.timelineControls.playPosition);
	}

    get end() {
        // relative to timline
        return this.offset + (this.finish - this.start);
    }

    get sceneDuration() {
        // relative to timline
        return this.finish - this.start;
    }

	get metadata() {
		return {
			thumbnails: [...this.thumbnails],
        	start: this.start,
        	duration: this.duration,
        	finish: this.finish,
        	offset: this.offset,
        	speed: this.speed,

        	x: this.x,
        	y: this.y,
        	z: this.z,
        	width: this.width,
        	height: this.height,
        	scaleX: this.scaleX,
        	scaleY: this.scaleY,
        	rotation: this.rotation,

        	animation: { ...this.animation},
        	filterMap: { ...this.filterMap },

	        transitionStart: { ...this.transitionStart },
			transitionEnd: { ...this.transitionEnd },

			trackId: this.trackId,
			
			processing: this.processing,
		};
	}

}

export default CommonState;