import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

class Lyric extends React.Component{
    constructor(props){
        super(props);
    }

    LyricChars(chars){
        return chars.map((c, index) => Elem('div', {className:"lyricChar", key:index}, c));
    }

    Lyrics(){
        let elems = [];
        Object.keys(this.props).forEach((key, index) =>{
            if(key != "children" && this.props[key]){
                elems.push(Elem('span', {className:"lyricSlot", key:index}, this.LyricChars(this.props[key])));
            }
        })
        return elems;
    }

    render() {
        return Elem('span', {ref:"lyric", className: "lyricBeat"}, this.Lyrics());
    }

}

export {Lyric};