

function InsertLyric(chorus, verses){

    let verseIndex = 0;
    let isConnecting = false;

    if(!!verses.length){
        verses = verses[0].map((x,i) => verses.map(x => !!x[i] ? x[i] : " "))
        console.log(verses);
    }

    console.log(chorus.ties);

    chorus.measures.forEach(function(measure){
        measure.beats.forEach(function(beat){

            let validSlot = (beat[0].pitch != "–") && (beat[0].pitch != "0");
            let withinTie = chorus.ties.some(tie => beat[0].index > tie.start && beat[0].index <= tie.end);

            if(validSlot && !withinTie){
                beat = beat.splice(Math.floor(beat.length /2), 0, {verse:verses[verseIndex]});
                verseIndex ++;
            } else {
                beat = beat.splice(Math.floor(beat.length /2), 0, {verse:verses[0].map(() => " ")});
            }

        })
    })

    console.log(chorus.measures);
}

function OrganizeParts(sections){

    let score = {chorus:{}, parts:[]};

    score.isPolyphony = null;

    sections.forEach(elem => {
        if(elem.name == "parts"){

            score.parts = elem.parts;

        } else if(elem.name == "phony"){
            score.isPolyphony = elem.phony == "polyphony";

            if(score.isPolyphony){
                score.verses = {}
            } else {
                score.verses = []
            }

        } else if(elem.name == "verses"){
            if(!score.isPolyphony){

                score.verses.push(elem.verses);

            } else if(score.isPolyphony) {
                score.verses[elem.part] = elem.content;
            } else {
                score.verses = {errorMsg : "不好意思……你需要在verse section之前就说清楚主调／复调类型"}
            }

        } else if(elem.name == "chorus"){

            // if(elem.part)
            score.chorus[elem.part] = elem.content;

        } else if(elem.literal){

            score[elem.name] = elem.content

        }
    })

    return score;
}

function arrangePolyphonyMeasures(score){
    score.parts.forEach(part => {
        // score.chorus[part]
    })
}

function Flatten(notes){
    return notes.reduce((notes, note) => {
        return notes.concat( note.notes ? Flatten(note.notes) : note)
    }, [])
}

function FlattenMeasure(measure){
    return (!!measure) ? Object.assign(measure, {beats: Flatten(measure.beats)}) : {}
}

function TransposeMeasure(measure, parts) {

    let longestBeats = 0;
    console.log(measure);
    for(let part of parts) {
        (longestBeats < measure[part].beats.length) && (longestBeats = measure[part].beats.length);
    }

    measure.beats = [];
    for (var i = 0; i < longestBeats; i++) {

        measure.beats[i] = [];

        parts.forEach((part, partIndex) => {
            measure.beats[i][partIndex] = measure[part].beats[i] ? measure[part].beats[i] : {}
        })
    }

    for (var part of parts) {
        measure.type = measure[part].type;
        delete measure[part];
    }

    return measure;
}

function GroupRangedBeat(range, beats){

    let groupedBeat = [];

    for (var beat of beats) {
        if((!!range.start && beat[0].index >= range.start && beat[0].index <= range.end) || range == beat[0].index){
            groupedBeat.push(beat);
        }
    }

    return groupedBeat;
}

function GroupBeats(measures){

    var beats;
    for (var measure of measures) {
        beats = [];
        for (var range of measure.beatRanges) {
            beats.push(GroupRangedBeat(range, measure.beats))
        }
        measure.beats = beats;
        delete measure.beatRanges;
    }
}

function arrangeHomophonyMeasures(score){

    // 找到拥有measure最多的那个声部
    let longestMeasures = 0;
    for(var part of score.parts){
        if(score.chorus[part].measures.length > longestMeasures){
            longestMeasures = score.chorus[part].measures.length;
        }
    }

    score.chorus.underbars = []
    score.chorus.ties = []
    for(var part of score.parts){
        score.chorus.underbars = score.chorus.underbars.concat(score.chorus[part].underbars);
        score.chorus.ties = score.chorus.ties.concat(score.chorus[part].ties);
        delete score.chorus[part].underbars;
        delete score.chorus[part].ties;
    }

    // // 将每个声部放进同一个measure里面去
    score.chorus.measures = []
    for (var i = 0; i < longestMeasures; i++) {

        score.chorus.measures.push({});

        for(var part of score.parts){
            if(!!score.chorus[part].measures[i]){
                score.chorus.measures[i][part] = FlattenMeasure(score.chorus[part].measures[i]);
            }
        };

        score.chorus.measures[i].beatRanges = score.chorus[score.parts[0]].measures[i].beatRanges;
        console.log(score.chorus.measures[i].beatRanges);
        score.chorus.measures[i] = TransposeMeasure(score.chorus.measures[i], score.parts)
    }

    InsertLyric(score.chorus, score.verses)
    GroupBeats(score.chorus.measures)



    // 删掉原先曲谱的chorus部分，它现在已经没用了
    for(var part of score.parts){
        delete score.chorus[part];
    }

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
