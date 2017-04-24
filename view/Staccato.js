import React from 'react';
import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

import scoreText from '../Lords_Prayer.txt';

import {default as Sidebar} from 'react-sidebar';

import {Elem, SectionElem, Draw} from "./General.js";

import {Chorus} from "./Chorus.js";

import {processSections} from "./StaccatoModel.js";

class Container extends React.Component {

    constructor(props) {
        super(props);

        let scoreParsed;

        try {
            scoreParsed = parse(scoreText);
            console.log(scoreParsed);
        } catch(err){
            scoreParsed = "err";
            console.log(err);
        }

        this.state = {
            text : scoreText,
            score : scoreParsed
        };
    }

    handleChange(event) {
        event.persist()

        let newText = event.target.value;

        let scoreParsed;

        try{
            scoreParsed = parse(newText);
        } catch(err){
            console.log(scoreParsed);
        }

        this.setState((previousState) => ({
            text : newText,
            score : scoreParsed
        }));

    }

    render() {

        let sectionElems = [], index = 0;
        for (let section in this.state.score) {
            if (this.state.score.hasOwnProperty(section)) {
                if(section != "chorus"){
                    sectionElems.push(SectionElem(section, index, this.state.score[section]));
                } else {
                    sectionElems.push(Elem(Chorus, Object.assign(this.state.score.chorus, {key:index, lyricLines : this.state.score.lyricLines})));
                }
                index++;
            }
        }

        const editor = Elem('textarea', {
            id        : 'editor',
            className : 'editor',
            rows      : 45,
            placeholder : 'yep',
            spellCheck  : 'false',
            value       : this.state.text,
            onChange    : (event) => this.handleChange(event)
        })

        const editorWrapper = Elem(Col, {
            key : 'editor',
            md  :  4,
            className:"editor-wrapper noprint"
        }, editor)

        let preview = Elem(Col, {
            key : 'viewer',
            md  :  7,
            id  : 'preview',
            className:'preview',
        }, Elem('div', {ref:"preview", id:'page', className:'page'}, sectionElems))

        const row = Elem(Row, {className:"con container"},
            [editorWrapper, preview]
        );

        return row
    }

    componentDidMount(){
    }
}

Draw(Container, {}, "null", 'container');
