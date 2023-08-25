import { makeAutoObservable, set } from "mobx";

import EditState from "./objects/editState";

import { randomUUID } from "../utilities/genericUtilities";

class IntentState {
    textCommand = "";
	sketchCommand = [];
	sketchPlayPosition = -1;
	trackId = 0;
	activeEdits = [];
	editOperationKey = "";
	id = "";
	idx = 0;
	requestParameters = {
		considerEdits: true,
		hasText: true,
		hasSketch: true,
	};

    constructor(domainStore, idx, textCommand, sketchCommand, sketchPlayPosition, trackId) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.domainStore = domainStore;
		this.idx = idx;
        this.textCommand = textCommand;
		this.sketchCommand = sketchCommand;
		this.sketchPlayPosition = sketchPlayPosition;
		this.editOperationKey = "";
		this.activeEdits = [];
		this.id = `intent-${randomUUID()}`;
		this.trackId = trackId;

		this.requestParameters = {
			considerEdits: true,
			hasText: textCommand !== "",
			hasSketch: sketchPlayPosition >= 0,
		};
    }

	getDeepCopy() {
		let newIntent = new IntentState(
			this.domainStore,
			this.idx,
			this.textCommand,
			this.sketchCommand,
			this.sketchPlayPosition,
			this.trackId
		);
		newIntent.editOperationKey = this.editOperationKey;
		newIntent.activeEdits = this.activeEdits.slice(0).map((edit) => {
			const newEdit = edit.getDeepCopy();
			newEdit.intent = newIntent;
			return newEdit;
		});
		return newIntent;
	}

	setTextCommand(textCommand) {
		this.textCommand = textCommand;
		this.requestParameters.hasText = textCommand !== "";
	}

	setSketchCommand(sketchCommand) {
		this.sketchCommand = sketchCommand;
	}

	setSketchPlayPosition(sketchPlayPosition) {
		this.sketchPlayPosition = sketchPlayPosition;
		this.requestParameters.hasSketch = sketchPlayPosition >= 0;
	}

	setEditOperationKey(newKey) {
		this.domainStore.rootStore.resetTempState();
		if (newKey === "") {
			this.editOperationKey = "";
			return;
		}
		if (!this.domainStore.editOperations[newKey].supported) {
			return;
		}
		this.editOperationKey = newKey;
		//conversion between types should happen
	}

	setRequestParameters(requestParameters) {
		this.requestParameters = {
			...this.requestParameters,
			...requestParameters,
		};
	}

	addActiveEdit(first, second) {
		const start = Math.min(first, second);
		const finish = Math.max(first, second);
		let newEdit = new EditState(this.domainStore, this, 0);
		newEdit.commonState.setMetadata({
			duration: this.domainStore.projectMetadata.duration,
			start: start,
			finish: finish, 
			offset: start,
			z: this.intentPos + 1,
		});
		this.activeEdits.push(newEdit);
		//this.activeEdits.sort((a, b) => a.commonState.offset - b.commonState.offset);
		return this.activeEdits[this.activeEdits.length - 1];
	}

	deleteEdits(selectedIds) {
		this.activeEdits = this.activeEdits.filter((edit) => {
            const isSelected = selectedIds.includes(edit.commonState.id);
            return !isSelected;
        });
	}

	getObjectById(id) {
		return this.activeEdits.find((edit) => edit.commonState.id === id);
	}

	getCanvasObjectById(id) {
		if (this.editOperationKey === "crop") {
			const realId = id.substring(3);
			return this.getObjectById(realId);
		}
		return this.getObjectById(id);
	}
	
	get allExcludedIds() {
		let result = [];
		for (let edit of this.activeEdits) {
			result.push(...edit.excludedIds);
		}
		return result;
	}

	get selectedPeriods() {
		return [];
	}
	get selectedTranscript() {
		return [];
	}
	get selectedEditOperation() {
		return [];
	}
	get selectedRectangle() {
		return [];
	}

	get editOperation() {
		if (this.editOperationKey === "") {
			return null;
		}
		return this.domainStore.editOperations[this.editOperationKey];
	}

	get intentPos() {
		return this.domainStore.intents.findIndex((intent) => intent.id === this.id);
	}

	get activeObjectsVisibility() {
		const playPosition = this.domainStore.rootStore.uiStore.timelineControls.playPosition;
		let result = [];
		for (let edit of this.activeEdits) {
			result.push(edit.isVisible(playPosition));
		}
		return result;
	}
}

export default IntentState;
