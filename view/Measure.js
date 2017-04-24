import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Slot} from "./Slot.js";

class Measure extends React.Component{
    constructor(props){
        super(props);
        this.notePoses = {}
        this.box = {}
    }

    GetNotePoses(){
        let notePoses = {}

        for(let ithBeat in this.refs){
            if(ithBeat != "measure"){
                let elem = this.refs[ithBeat]
                Object.assign(notePoses, elem.notePoses)
            }
        }

        return notePoses;
    }

    SlotElems(){

        return this.props.measure.beats.map((slot, index)=>Elem(Slot, Object.assign(slot, {
            key : index,
            ref : "slot-" + index,
            parts : this.props.parts,
            lyricLines : this.props.lyricLines
        })));
    }

    render() {
        let slotElems = this.SlotElems();
        return Elem('div', {style:{minWidth:slotElems.length/4*15+"%"}, ref:"measure", className:"measure"}, slotElems);
    }

    componentDidMount(){
        this.box = this.refs.measure.getBoundingClientRect();
    }
}

export {Measure};