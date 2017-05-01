import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Lyric} from "./Lyric.js";

import {Note} from "./Note.js";

class Slot extends React.Component{
    constructor(props){
        super(props);
    }

    NoteElems(){
        return this.props.notes.map((note, index)=>Elem(Note, {ref:index, key:index, note:note}));
    }

    Elems(){
        let elems = [], index = 0;

        // console.log(this.props.slot);

        // this.props.slots.forEach((slot, index)=> {
        //     console.log(slot);
        // })

        this.props.slot.forEach((cell, index) => {

            if(!!cell.pitch)
                elems.push(Elem(Note, {note:cell, key:index, ref:index}));
            else
                elems.push(Elem(Lyric, {lyric:cell.verse, key:index+250}));
        })

        return elems;
    }

    render(){
        return Elem('div', {style:{}, ref:"slot", className:"slot"}, this.Elems());
    };
}

export {Slot};
