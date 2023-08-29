import { action, makeAutoObservable, runInAction, toJS } from "mobx";

import VideoState from "./objects/videoState";
import IntentState from "./intentState";
import { firestore } from "../services/firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { requestSuggestions, requestSummary } from "../services/pipeline";
import EditState from "./objects/editState";

class DomainStore {
	domainDoc = "domain";

	processingIntent = false;

	in_mainVideos = [];
	
	intents = [];
	curIntentPos = 0;

    projectMetadata = {
        projectId: "test",
        title: "TEST",
        fps: 25,
        width: 854,
        height: 480, //720p
        duration: 10, // seconds
        trackCnt: 1,
		totalIntentCnt: 0,
    };

	editOperations = {
		"text": {
			title: "Text",
			icon: null,
			supported: true,
			linearize: false,
		},
		"image": {
			title: "Image",
			icon: null,
			supported: true,
			linearize: false,
		},
		"shape": {
			title: "Shape",
			icon: null,
			supported: true,
			linearize: false,
		},
		"cut": {
			title: "Cut",
			icon: null,
			supported: true,
			linearize: true,
		},
		"crop": {
			title: "Crop",
			icon: null,
			supported: true,
			linearize: true,
		},
		"zoom": {
			title: "Zoom",
			icon: null,
			supported: true,
			linearize: true,
		},
		"blur": {
			title: "Blur",
			icon: null,
			supported: true,
			linearize: true,
		},
	};

	inputOperationMapping = {
		text: [
			"content",
		],
		file: [
			"source",
		],
		dropdown: [
			"style.fontFamily",
		],
		color: [
			"style.fill",
			"background.fill",
			"stroke.fill",
		],
		range: [
			"background.alpha",
			"stroke.alpha",
		],
		number: [
			"star.numPoints",
			"star.innerRadius",
			"star.outerRadius",
			"circle.radiusX",
			"circle.radiusY",
			"zoomDurationStart",
			"zoomDurationEnd",
			"stroke.width",
			"style.fontSize",
			"x",
			"y",
			"z",
			"width",
			"height",
			"start",
			"finish",
			"duration",
			"speed",
			"scaleX",
			"scaleY",
			"rotation",
			"cropX",
			"cropY",
			"cropWidth",
			"cropHeight",
			"blur",
		],
		toggle: [
			"cropped",
		],
		align: [
			"type",
			"style.align",
			"style.verticalAlign",
		],
	};

	operationNameMapping = {
		"content": "Text",
		"source": "Image",
		"type": "Shape",
		"style.fontFamily": "Font Family",
		"style.fill": "Color",
		"background.fill": "BG Color",
		"stroke.fill": "Stroke Color",
		"background.alpha": "BG Opacity",
		"stroke.alpha": "Stroke Opacity",
		"stroke.width": "Stroke Width",
		"style.fontSize": "Font Size",
		"x": "X",
		"y": "Y",
		"z": "Z",
		"width": "Width",
		"height": "Height",
		"start": "Start",
		"finish": "Finish",
		"duration": "Duration",
		"speed": "Speed",
		"scaleX": "Scale X",
		"scaleY": "Scale Y",
		"rotation": "Rotation",
		"cropX": "Crop X",
		"cropY": "Crop Y",
		"cropWidth": "Crop Width",
		"cropHeight": "Crop Height",
		"blur": "Blur",
		"cropped": "Cropped",
		"style.align": "Align",
		"style.verticalAlign": "Vertical Align",
		"zoomDurationStart": "Zoom Duration Beg.",
		"zoomDurationEnd": "Zoom Duration End",
		"star.numPoints": "Points",
		"star.innerRadius": "Inner Radius",
		"star.outerRadius": "Outer Radius",
		"circle.radiusX": "Radius X",
		"circle.radiusY": "Radius Y",
	};
	
	dropdownOptions = {
		"style.fontFamily": [
			"Arial",
			"Times New Roman",
			"Courier New",
		],
		"type": [
			"rectangle",
			"circle",
			"star",
		],
		"style.align": [
			"left",
			"center",
			"right",
		],
		"style.verticalAlign": [
			"top",
			"middle",
			"bottom",
		],
	};

	skipParameterIfMultiple = [
		"source",
		"start",
		"finish",
		"duration",
		"speed",
	];

    constructor(rootStore) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.rootStore = rootStore;

		this.in_mainVideos = [];

		this.projectMetadata.totalIntentCnt = 1;
        this.intents = [
				new IntentState(this, this.projectMetadata.totalIntentCnt, "", [], -1, 0)
		];
		this.curIntentPos = 0;
    }

	loadVideo(videoLink, videoId) {
		this.resetAll();
		this.projectMetadata.projectId = videoId;
        this.in_mainVideos = [
			new VideoState(
				this,
				this.in_mainVideos,
				videoLink,
				0,
				true,
			),
		];
		this.projectMetadata.trackCnt = 1;
	}

	resetAll() {
		this.in_mainVideos = [];
		this.projectMetadata = {
			projectId: "test",
			title: "TEST",
			fps: 25,
			width: 854,
			height: 480, //720p
			duration: 10, // seconds
			trackCnt: 1,
			totalIntentCnt: 1,
		};
		this.intents = [
			new IntentState(this, this.projectMetadata.totalIntentCnt, "", [], -1, 0)
		];
		this.curIntentPos = 0;
	}

	addIntent() {
		this.curIntentPos = this.intents.length;
		this.projectMetadata.totalIntentCnt += 1;
		this.intents.push(
			new IntentState(this, this.projectMetadata.totalIntentCnt, "", [], -1, 0)
		);
		this.rootStore.resetTempState();
	}
	
	addRandomIntent() {
		const systemSetting = this.rootStore.userStore.systemSetting;
		this.curIntentPos = this.intents.length;
		this.projectMetadata.totalIntentCnt += 1;
		const newIntent = new IntentState(this, this.projectMetadata.totalIntentCnt, "", [], -1, 0);

		const randomEditOperationKey = Object.keys(this.editOperations)[Math.floor(Math.random() * Object.keys(this.editOperations).length)];
		const randomSuggestedEditOperationKey = Object.keys(this.editOperations)[Math.floor(Math.random() * Object.keys(this.editOperations).length)];
		const randomConsiderEdits = Math.random() > 0.5;
		const randomTextCommand = Math.random() > 0.5 ? "add" : "remove";
		const randomSketchCommand = Math.random() > 0.5 ? [
			{"x":301.33360941977077,"y":89.85530200080066,"width":389.0716332378223,"height":348.4185179622882,"stroke":"red","strokeWidth":2,"lineCap":"round","lineJoin":"round"}
		] : [];
		const randomSketchPlayPosition = Math.random() * this.projectMetadata.duration;
		
		newIntent.setEditOperationKey(randomEditOperationKey);
		newIntent.suggestedEditOperationKey = randomSuggestedEditOperationKey;
		newIntent.considerEdits = randomConsiderEdits;
		newIntent.textCommand = randomTextCommand;
		newIntent.summary = randomTextCommand;
		newIntent.sketchCommand = randomSketchCommand;
		newIntent.sketchPlayPosition = randomSketchPlayPosition;
		
		const randomEditsLength = Math.floor(Math.random() * 5);
		const randomSuggestedEditsLength = systemSetting ? Math.floor(Math.random() * 5) : 0;
		for (let i = 0; i < randomEditsLength; i++) {
			newIntent.addRandomEdit(false);
		}
		for (let i = 0; i < randomSuggestedEditsLength; i++) {
			newIntent.addRandomEdit(true);
		}

		this.intents.push(newIntent);

		this.rootStore.resetTempState();
	}

	deleteIntent(intentPos) {
		if (intentPos >= this.intents.length || intentPos < 0) {
			return;
		}
		this.intents = this.intents.filter((intent, idx) => idx !== intentPos);
		this.intents = this.intents.map((intent, idx) => {
			if (idx < intentPos) {
				return intent;
			}
			for (let edit of intent.activeEdits) {
				edit.commonState.setMetadata({
					z: idx + 1,
				});
			}
			for (let edit of intent.suggestedEdits) {
				edit.commonState.setMetadata({
					z: idx + 1,
				});
			}
			return intent;
		});
		this.curIntentPos = this.intents.length - 1;
		if (this.curIntentPos < 0) {
			this.addIntent();
		}
		this.rootStore.resetTempState();
	}

	moveIntent(intentPos, newPos) {
		console.log("moving", intentPos, newPos);
	}

	copyIntentToCurrent(intentPos) {
		if (intentPos >= this.intents.length || intentPos < 0) {
			return;
		}
		const deepCopy = this.intents[intentPos].getDeepCopy();
		deepCopy.idx = this.intents[this.curIntentPos].idx;
		this.intents[this.curIntentPos] = deepCopy;
		for (let edit of deepCopy.activeEdits) {
			edit.commonState.setMetadata({
				z: this.curIntentPos + 1,
			});
		}
		for (let edit of deepCopy.suggestedEdits) {
			edit.commonState.setMetadata({
				z: this.curIntentPos + 1,
			});
		}
		this.rootStore.resetTempState();
	}

	setCurIntent(intentPos) {
		if (intentPos >= this.intents.length || intentPos < 0) {
			return;
		}
		this.curIntentPos = intentPos;
		this.rootStore.resetTempState();
	}

	processIntent() {
		if (this.processingIntent) {
			return;
		}
		this.processingIntent = true;
		// request
		const requestData = {
			projectId: "",
			projectMetadata: {},
			edits: [],
			requestParameters: {},
			editParameterOptions: toJS({ ...this.dropdownOptions }),
			editOperations: Object.keys(toJS(this.editOperations)),
		};
		requestData.projectId = toJS(this.projectMetadata.title);
		requestData.projectMetadata = toJS({
			...this.projectMetadata
		});
		requestData.edits = [...this.curIntent.activeEdits].map((edit) => {
			return toJS(edit.requestBody);
		});
		requestData.requestParameters = toJS({
			...this.curIntent.requestParameters,
		});

		// response
		// make sure zIndex is fine
		// make sure to edit suggesteEditOperationKey and remove it if they are equal

		this.curIntent.suggestedEdits = [];

		requestSummary({
			input: requestData.requestParameters.text,
		}).then(action((responseData) => {
			if (responseData === null || responseData.summary === undefined) {
				this.processingIntent = false;
				return;
			}
			const summary = responseData.summary;
			this.curIntent.summary = summary;
			requestSuggestions(requestData).then(action((responseData) => {
				if (responseData === null || responseData.edits === undefined) {
					this.processingIntent = false;
					return;
				}
				const suggestedEditOperationKey	= responseData.requestParameters.editOperation;
				const suggestedEdits = responseData.edits;
				this.curIntent.suggestedEdits = suggestedEdits.map((edit) => {
					const newEdit = new EditState(this, this.curIntent, true, this.curIntent.trackId);
					newEdit.commonState.setMetadata({
						duration: this.projectMetadata.duration,
						z: this.curIntent.intentPos + 1,
					});
					newEdit.setResponseBody(edit);
					return newEdit;
				});
				if (suggestedEditOperationKey !== this.curIntent.editOperationKey) {
					this.curIntent.suggestedEditOperationKey = suggestedEditOperationKey;
				}
				else {
					this.curIntent.suggestedEditOperationKey = "";
				}
				this.processingIntent = false;
			})).catch(action((error) => {
				console.log("error", error);
				this.processingIntent = false;
			}));
		})).catch(action((error) => {
			console.log("error", error);
			this.processingIntent = false;
		}));
	}

	// linearizeEdits(editHierarchy) {
	// 	let result = [];
	// 	for (let edits of editHierarchy) {
	// 		for (let edit of edits) {
	// 			const editCopy = edit.getDeepCopy();
	// 			for (let prevEdit of result) {
	// 				const left = Math.max(prevEdit.commonState.offset, editCopy.commonState.offset);
	// 				const right = Math.min(prevEdit.commonState.end, editCopy.commonState.end);
	// 				if (left >= right) {
	// 					continue;
	// 				}
	// 				let metadataUpdate = {};
	// 				if (prevEdit.commonState.offset <= editCopy.commonState.offset) {
	// 					metadataUpdate = {
	// 						finish: editCopy.commonState.offset,
	// 					};
	// 				}
	// 				else if (prevEdit.commonState.end >= editCopy.commonState.end) {
	// 					metadataUpdate = {
	// 						start: editCopy.commonState.end,
	// 						offset: editCopy.commonState.end,
	// 					};
	// 				}
	// 				else {
	// 					metadataUpdate = {
	// 						start: 0,
	// 						offset: 0,
	// 						finish: 0,
	// 					}
	// 				}
	// 				prevEdit.commonState.setMetadata(metadataUpdate);
	// 			}
	// 			result.push(editCopy);
	// 		}
	// 	}
	// 	return result.filter((edit) => edit.commonState.sceneDuration > 0);
	// }

	getVideoById(id) {
		return this.in_mainVideos.find((video) => video.commonState.id === id);
	}

    get transcripts() {

		const needPause = (prevEnd, nextStart) => {
			if (prevEnd === nextStart) {
				return false;
			}
			if (prevEnd === this.projectMetadata.duration) {
				return false;
			}
			return nextStart - prevEnd > 3;
		}

        let transcript = [];
        for (let video of this.videos) {
            transcript = [...transcript, ...video.adjustedTranscript];
        }
        transcript.sort((p1, p2) => p1.start - p2.start);
		let transcript_with_pauses = [];
		for (let i = 0; i < transcript.length; i++) {
			const curTranscript = transcript[i];
			if (i === 0 && needPause(0, curTranscript.start)) {
				transcript_with_pauses.push({
					start: 0,
					finish: curTranscript.start,
					text: "[PAUSE]",
				});
			}
			if (i > 0) {
				const lastTranscript = transcript_with_pauses[transcript_with_pauses.length - 1];
				if (needPause(lastTranscript.finish, curTranscript.start)) {
					transcript_with_pauses.push({
						start: lastTranscript.finish,
						finish: curTranscript.start,
						text: "[PAUSE]",
					});
				}
			}
			transcript_with_pauses.push(curTranscript);
		}
		if (transcript_with_pauses.length === 0) {
			return [{
				start: 0,
				finish: this.projectMetadata.duration,
				text: "[PAUSE]",
			}];
		}
		const lastTranscript = transcript_with_pauses[transcript_with_pauses.length - 1];
		if (lastTranscript.finish < this.projectMetadata.duration) {
			transcript_with_pauses.push({
				start: lastTranscript.finish,
				finish: this.projectMetadata.duration,
				text: "[PAUSE]",
			});
		}
        return transcript_with_pauses;
    }

	get transcriptSelectedIndex() {
		const largerIndex = this.transcripts.findIndex((item) => {
			if (item.start > this.rootStore.uiStore.timelineControls.playPosition) {
				return true;
			}
			return false;
		});
	
		return largerIndex === -1 ? (this.transcripts.length - 1) : (largerIndex - 1);
	}

	get videos() {
		return this.in_mainVideos;
	}

	get texts() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Text") {
					result.push(edit);
				}
			}
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Text") {
				result.push(edit);
			}
		}
		return result;
	}

	get images() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Image") {
					result.push(edit);
				}
			}	
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Image") {
				result.push(edit);
			}
		}
		return result;
	}

	get shapes() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Shape") {
					result.push(edit);
				}
			}	
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Shape") {
				result.push(edit);
			}
		}
		return result;
	}

	get skippedParts() {
		let result = [];
		for (let intent of this.intents) {
			if (intent.id === this.curIntent.id) {
				continue;
			}
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Cut") {
					result.push(edit);
				}
			}
		}
		return result;
	}

	get allSkippedParts() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Cut") {
					result.push(edit);
				}
			}
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Cut") {
				result.push(edit);
			}
		}
		return result;
	}

	get crops() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Crop") {
					result.push(edit);
				}
			}
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Crop") {
				result.push(edit);
			}
		}
		return result;
	}

	get zooms() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Zoom") {
					result.push(edit);
				}
			}
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Zoom") {
				result.push(edit);
			}
		}
		return result;
	}

	get blurs() {
		let result = [];
		for (let intent of this.intents) {
			for (let edit of intent.activeEdits) {
				if (intent.editOperation === null) {
					continue;
				}
				if (intent.editOperation.title === "Blur") {
					result.push(edit);
				}
			}
		}
		if (!this.rootStore.userStore.systemSetting) {
			return result;
		}
		
		for (let edit of this.curIntent.suggestedEdits) {
			if (this.curIntent.editOperation === null) {
				continue;
			}
			if (this.curIntent.editOperation.title === "Blur") {
				result.push(edit);
			}
		}
		return result;
	}

	get orderedAllObjects() {
		const texts = this.texts;
		const images = this.images;
		const shapes = this.shapes;
		const skippedParts = this.allSkippedParts;
		const crops = this.crops;
		const zooms = this.zooms;
		const blurs = this.blurs;
		const objects = [
			...texts,
			...images,
			...shapes,
			...skippedParts,
			...crops,
			...zooms,
			...blurs
		].filter((object) => object.intent.idx !== this.curIntent.idx);
		objects.sort((a, b) => a.commonState.z - b.commonState.z);
		
		if (this.curIntent.editOperation !== null) {
			if (!this.rootStore.userStore.systemSetting) {
				return [...objects, ...this.curIntent.activeEdits];
			}	
			return [...objects, ...this.curIntent.activeEdits, ...this.curIntent.suggestedEdits];
		}
		return objects;
	}

	get curIntent() {
		return this.intents[this.curIntentPos];
	}

	get curVideo() {
		if (this.in_mainVideos.length === 0) {
			return null;
		}
		return this.in_mainVideos[0];
	}


	saveFirebase(userId, taskIdx) {
		const projectId = this.projectMetadata.projectId;
		const projectCollection = collection(firestore, this.rootStore.collection, userId, projectId);
		const projectDomain = doc(projectCollection, this.domainDoc).withConverter(this.domainStoreConverter);
		return new Promise(async (resolve, reject) => {
			try {
				let allVideoPromises = [];
				for (let video of this.in_mainVideos) {
					allVideoPromises.push(video.saveFirebase(userId, taskIdx));
				}		
				await Promise.all(allVideoPromises);
			} catch (error) {
				reject("videos save error: " + error);
			}
			try {
				let allIntentPromises = [];
				for (let intent of this.intents) {
					allIntentPromises.push(intent.saveFirebase(userId, taskIdx));
				}		
				await Promise.all(allIntentPromises);
			} catch (error) {
				reject("intents save error: " + error);
			}
			setDoc(projectDomain, this, {merge: false}).then(() => {
				resolve();
			}).catch((error) => {
				reject("domain save error: " + error.message);
			});
		});
	}

	fetchFirebase(userId, taskIdx, projectId) {
		const projectCollection = collection(firestore, this.rootStore.collection, userId, projectId);
		const projectDomain = doc(projectCollection, this.domainDoc).withConverter(this.domainStoreConverter);
		return new Promise((resolve, reject) => {
			getDoc(projectDomain).then(action(async (fetchedDomainStore) => {
				const data = fetchedDomainStore.exists() ? fetchedDomainStore.data() : null;
				if (data === null || data.projectMetadata === undefined) {
					this.resetAll();
					resolve();
				}
				this.in_mainVideos = [];
				this.intents = [];
				this.projectMetadata = {
					...data.projectMetadata,
				};
				this.curIntentPos = data.curIntentPos;
				for (let videoId of data.in_mainVideos) {
					const newVideo = new VideoState(
						this,
						this.in_mainVideos,
						"",
						0,
						false,
					);
					try {
						const success = await newVideo.fetchFirebase(userId, taskIdx, videoId);
						if (success) {
							runInAction(() => {
								this.in_mainVideos.push(newVideo);
							});
						}
					} catch (error) {
						console.log(error);
					}
				}

				for (let intentId of data.intents) {
					const newIntent = new IntentState(
						this,
						0,
						"",
						[],
						-1,
						0, 
					);
					try {
						const success = await newIntent.fetchFirebase(userId, taskIdx, intentId);
						if (success) {
							runInAction(() => {
								this.intents.push(newIntent);
							});
						}
					} catch (error) {
						console.log(error);
					}
				}

				resolve();
			})).catch((error) => {
				reject("domain fetch error: " + error.message);
			});
		});
	}

	domainStoreConverter = {
		toFirestore: function(domainStore) {
			const data = {
				in_mainVideos: [],
				projectMetadata: {
					...toJS(domainStore.projectMetadata)
				},
				intents: [],
				curIntentPos: domainStore.curIntentPos,
			};
			for (let video of domainStore.in_mainVideos) {
				//const convertedVideo = video.videoStateConverter.toFirestore(video);
				data.in_mainVideos.push(video.commonState.id);
			}
			for (let intent of domainStore.intents) {
				//const convertedIntent = intent.intentStateConverter.toFirestore(intent);
				data.intents.push(intent.id);
			}
			//console.log("to", data);
			return data;
		},
		fromFirestore: function(snapshot, options) {
			const data = snapshot.data(options);
			//console.log("from", data);
			return data;
		}	
	};
	
}

export default DomainStore;
