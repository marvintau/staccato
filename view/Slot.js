import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Lyric} from "./Lyric.js";

import {Beat} from "./Beat.js";

class Slot extends React.Component{
    constructor(props){
        super(props);
    }

    Elems(){
        let elems = [], index = 0;

        this.props.parts.forEach((partName, index) => {

            elems.push(Elem(Beat, Object.assign(this.props[partName], {key:index > 1 ? index + 500 : index, ref:partName})));
            
            if(index == 1){
                if(this.props.lyric){
                    elems.push(Elem(Lyric, Object.assign(this.props.lyric, {key:index+250})));
                }
                else
                    elems.push(Elem(Lyric, Object.assign([Array(this.props.lyricLines).fill(" ")], {key:index+250})));
            }
        })

        return elems;
    }

    render(){
        return Elem('div', {style:{}, ref:"slot", className:"slot"}, this.Elems());
    };
}

export {Slot};