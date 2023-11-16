import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { action } from "mobx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import ChatTabTemplate from "./ChatTabTemplate";
import ChatTab from "./ChatTab";

import useRootContext from "../hooks/useRootContext";
import { TbBucket } from "react-icons/tb";

const ChatTemplate = observer(function ChatTemplate() {
	const { userStore, uiStore, domainStore } = useRootContext();

	const curTab = domainStore.curTab;
	const tabs = domainStore.tabs;

    const addTab = action(() => {
		domainStore.addTab();
    });

	const setCurTab = action((tabIdx) => {
		domainStore.setCurTab(tabIdx);
	});

	const deleteTab = action((tabIdx) => {
		domainStore.deleteTab(tabIdx);
	});

	//TODO: handle keydown
	const handleKeyDown = action((event) => {
		// Cmd + T -> add tab
		if (event.metaKey && event.key === "t") {
			addTab();
		}
		// Cmd + W -> close tab
		else if (event.metaKey && event.key === "w") {
			deleteTab(curTab.idx);
		}
	});

    return (
        <div className="w-100">
			<ChatTab />
			{/* <ChatTabTemplate /> */}
            <div className="flex flex-start overflow-auto text-xs">
                {tabs.map((tab, idx) => {
					return (<div
						key={`tab-${tab.idx}`}
						onClick={action(() => setCurTab(idx))}
						className={
							`tab ${curTab.id === tab.id ? "active-tab" : ""} ` + 
							"flex flex-row items-center justify-between gap-1"
						}
					>
						<span
							className="truncate"
						> 
							{tab.idx + 1}: {tab.title}
						</span> 
						<div className="h-full hover:bg-gray-300 flex items-center" onClick={action(() => deleteTab(idx))}>
							<TbBucket />
						</div>
                    </div>);
				})}
                <div className="add-tab" onClick={addTab}>
                    <FontAwesomeIcon icon={faPlus} />
                </div>
            </div>
        </div>
    );
});

export default ChatTemplate;
