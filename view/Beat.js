import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Slot} from "./Slot.js";

class Beat extends React.Component{
    constructor(props){
        super(props);
    }

    GetNotePoses(){

        let notePoses = {};

        for(let ithNote in this.refs){
            if(ithNote != "beat"){
                notePoses[ithNote] = this.refs[ithNote].box
            }
        }

        return notePoses;
    }

    GetUnderbarPoses(notePoses, beatBox){

        // by subtracting the score position from the underbar position,
        // we made the new undarbar position relative to score element.

        return this.props.underbar.map((elem) => ({
            left:notePoses[elem.start].left - beatBox.left,
            width:notePoses[elem.end].right - notePoses[elem.start].left,
            top:notePoses[elem.start].bottom + elem.level * 3 - beatBox.top})
        )
    }

    // UnderbarElems(offset){
    //     return this.state.underbarPoses.map((elem, index) => Elem(Underbar, {key:index+offset, left:elem.left, width:elem.width, top:elem.top}))
    // }

    SlotElems(){
        return this.props.slots.map((slot, index)=>Elem(Slot, {slot:slot, key : index, ref : "slot-" + index}));
    }

    render() {

        // let underbarElems = this.UnderbarElems(this.NoteElems().length);

        return Elem('div', {ref:"beat", className: "beat"}, this.SlotElems());
    }

    componentDidMount(){

        // let beatBox = this.refs.beat.getBoundingClientRect();
        //
        // this.setState({underbarPoses: this.props.underbar ? this.GetUnderbarPoses(this.GetNotePoses(), beatBox) : []})
    }

}

export {Beat};
