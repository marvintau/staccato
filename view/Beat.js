import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Note} from "./Note.js";

class Underbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){

        let style = {
            left:this.props.left,
            width:this.props.width,
            top :this.props.top
        }

        return Elem('div', {style:style, className:"underbar"})
    }
}

class Beat extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            underbarPoses : this.props.underbar ? this.props.underbar.map((elem) => ({left:0, width:0, top:0})) : []
        }

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


    NoteElems(){
        return this.props.notes.map((note, index)=>Elem(Note, {ref:index, key:index, note:note}));
    }

    UnderbarElems(offset){
        return this.state.underbarPoses.map((elem, index) => Elem(Underbar, {key:index+offset, left:elem.left, width:elem.width, top:elem.top}))
    }


    render() {

        // console.log(this.props)

        let underbarElems = this.UnderbarElems(this.NoteElems().length);
        let noteElems = this.NoteElems().concat(underbarElems);

        return Elem('span', {ref:"beat", className: "beat"}, noteElems);
    }

    componentDidMount(){

        let beatBox = this.refs.beat.getBoundingClientRect();

        this.setState({underbarPoses: this.props.underbar ? this.GetUnderbarPoses(this.GetNotePoses(), beatBox) : []})
    }

}

export {Beat};