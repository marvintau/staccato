
function InsertLyric(measures, lyrics){

    let lyricIndex = 0;
    let isConnecting = false;

    measures.forEach(function(measure, index){
        measure.beats.forEach(function(beat, beatIndex){

            if((beat[0].pitch != "–") && (beat[0].pitch != "0") && !isConnecting){
                note.splice(Math.floor(beat.length /2), 0, {lyric: score.verses[ithWord]});
            }


            if((res.length==0 || (res.length>0 && res[res.length - 1].end)) && note.upperConn == "open") {
                res.push({start:{measure:index, beat:beatIndex, note:noteIndex}});
                isConnecting = true;
            }

            if(res.length>0 && !res[res.length-1].end && note.upperConn == "close"){
                res[res.length-1].end = {measure:index, beat:beatIndex, note:noteIndex}

                isConnecting = false;
            }

            delete note.upperConn

        })
    })
    return {ranges:res, slots:slots};
}

function OrganizeParts(sections){

    let score = {chorus:{}, verses:{}, parts:[]};

    score.isPolyphony = null;

    sections.forEach(elem => {
        if(elem.name == "parts"){

            score.parts = elem.parts;

        } else if(elem.name == "phony"){
            console.log(elem.phony)
            score.isPolyphony = elem.phony == "polyphony";

        } else if(elem.name == "verse"){

            if(!score.isPolyphony){
                score.verses = elem.verses;
            } else if(score.isPolyphony) {
                score.verses[elem.part] = elem.content;
            } else {
                score.verses = {errorMsg : "不好意思……你需要在verse section之前就说清楚主调／复调类型"}
            }

        } else if(elem.name == "chorus"){

            // if(elem.part)

            score.chorus[elem.part] = elem.content;

        } else {

            score[elem.name] = elem.content

        }
    })

    return score;
}

function TransposeMeasure(measure, parts) {

    let longestBeats = 0;
    for(let part of parts) {
        (longestBeats < measure.chorus[part].beats.length) && (longestBeats = measure.chorus[part].beats.length);
    }

    measure.beats = [];
    for (var i = 0; i < longestBeats; i++) {

        measure.beats[i] = [];

        parts.forEach((part, partIndex) => {
            measure.beats[i][partIndex] = measure.chorus[part].beats[i] ? measure.chorus[part].beats[i] : {}
        })
    }

    measure.ties = [];
    measure.underbars = [];
    for (var part of parts) {
        measure.type = measure.chorus[part].type;
        measure.underbars = measure.underbars.concat(measure.chorus[part].underbars);
        measure.ties = measure.ties.concat(measure.chorus[part].ties);
    }

    delete measure.chorus;
    return measure;
}

function arrangePolyphonyMeasures(score){
    score.parts.forEach(part => {
        // score.chorus[part]
    })
}

function Flatten(measure){
    return measure.reduce((notes, note) => {

        return notes.concat( note.notes ? Flatten(note.notes) : note)}, [])
}

function GetTies(measure){
    return measure.reduce((ties, note) => {
        if(note.tie) ties = ties.concat([note.tie]);

        delete note.tie;
        return ties;
    }, [])
}

function GetUnderbars(measure){
    return measure.reduce((underbars, note) => {

        let currentUnderbar = note.underbar ? [note.underbar] : [];
        let nestedUnderbars = note.notes ? GetUnderbars(note.notes) : [];

        delete note.underbar;

        return underbars.concat(currentUnderbar).concat(nestedUnderbars);
    }, [])
}


function AppendOctave(measure){

    measure.beats = measure.beats.map((note) =>{

        let underbarLevels;
        for (let bar of measure.underbars){
            if(note.index <= bar.end && note.index >= bar.start){
                underbarLevels++;
            }
        }

        let position = (note.octave && note.octave>0)? 0 : underbarLevels;
        let octave = note.octave ? {start:position, nums:note.octave} : undefined
        return Object.assign(note, { octave: octave });
    });

    return measure;
}

function Process(measure){
    if(measure){
        measure.underbars = GetUnderbars(measure.beats);
        measure.beats = Flatten(measure.beats);
        measure.ties = GetTies(measure.beats);
        measure = AppendOctave(measure);
        return measure;
    } else {
        return {}
    }
}


function arrangeHomophonyMeasures(score){

    // 找到拥有measure最多的那个声部
    let longestMeasures = 0;
    score.measures = [];
    for(var part of score.parts){
        if(score.chorus[part].length > longestMeasures){
            longestMeasures = score.chorus[part].length;
        }
    }

    // 将每个声部放进同一个measure里面去
    for (var i = 0; i < longestMeasures; i++) {

        score.measures[i] = {chorus:{}};

        for(var part of score.parts){
            score.measures[i].chorus[part] = Process(score.chorus[part][i]);
        };
        score.measures[i] = TransposeMeasure(score.measures[i], score.parts);
    }
    // 删掉原先曲谱的chorus部分，它现在已经没用了
    for(var part of score.parts){
        delete score.chorus[part];
    }

    let ithWord = 0;

    console.log(score.verses);

    delete score.chorus
    // console.log(JSON.stringify(score.measures, null, 2));
    return score;
}

function arrangeMeasures(score){
    if(score.isPolyphony){
        delete score.isPolyphony;
        return arrangePolyphonyMeasures(score);
    } else {
        delete score.isPolyphony;
        return arrangeHomophonyMeasures(score);
    }
}

function processSections(sections){

    // 在这一步做的主要工作是验证歌谱的类型，是单调还是复调，有没有缺少的部分，之后
    // 再处理每一小节的内容

    let score = OrganizeParts(sections);

    // console.log(JSON.stringify(score, null, 2));

    let arrangedScore = arrangeMeasures(score);
    delete arrangedScore.parts;
    delete arrangedScore.verses;
    console.log(arrangedScore);
    return arrangedScore;
}

export {processSections};
