'use strict'

const BASE_LAY = 3.772
const BASE_SHP = 7.148
const PRECISION = 3

let slt, lay, shp, arti, map, maxIndex, max

$(() => {
	loadTheme()
	loadValuesFromUrl()

	calc()

	$('.arti-select').change(() => {
		calc()
	})

	$('#td-bonus').on('input', () => {
		calc()
	})

	$('#theme-toggle').click(() => {
		toggleTheme()
	})

	$('#save-preset-btn').click(() => {
		const elInput = $('#save-preset-name')
		const name =  elInput.val()
		if(name === '') {
			elInput.focus()
			return;
		}

		savePreset(name)
	})

	let detailsState = localStorage.getItem('detailsState')

  
	if (detailsState === 'visible') {
		$('#toggle-details-area').show()
	} else {
		$('#toggle-details-area').hide()
	}
})

$('#toggle-details').click(function(){
    $('#toggle-details-area').slideToggle()
    let currentState = $('#toggle-details-area').is(':visible') ? 'visible' : 'hidden'
    localStorage.setItem('detailsState', currentState)
})

const loadValuesFromUrl = () => {
	let count = 0;
	const urlParams = new URLSearchParams(window.location.search)
	urlParams.forEach((v, k) => {
		let elInput = $('#' + k)
		if(!elInput.length) return

		count++
		elInput.val(v)
	})

	if(!count) return

	if(count === 5) {
		iziToast.destroy()
		iziToast.success({
		    message: `Values loaded from URL successfully`,
		})
	} else {
		iziToast.destroy()
		iziToast.warning({
		    message: `Only partial values loaded from URL`,
		})
	}

    history.replaceState({}, '', window.location.pathname)

    calc()
	
}

$('#load-preset-modal').on('click', '.load-preset', function() {
	loadPreset($(this).closest('tr').data('index'))
})
$('#load-preset-modal').on('click', '.delete-preset', function() {
	const elTr = $(this).closest('tr')
	Swal.fire({
  		title: 'Are you sure?',
  		text: `Deleting preset '${elTr.find('.preset-name').text()}'!`,
  		icon: "warning",
  		showCancelButton: true,
	}).then((res) => {
		if (res.isConfirmed) {
    		deletePreset($(this).closest('tr').data('index'))
		}
	})
})

$('#copy-set-link').click(() => {
	navigator.clipboard.writeText(getUrlLink());
	iziToast.destroy()
	iziToast.success({
	    message: `Link copied to the clipboard`,
	})
})

const getUrlLink = () => {
	let urlParams = new URLSearchParams()
    $('.arti-select').each(function() {
        urlParams.set($(this).attr('id'), $(this).val())
    })
    urlParams.set('td-bonus', $('#td-bonus').val())

    return window.location.origin + window.location.pathname + '?' + urlParams.toString()
}

$('#load-preset-modal').on('shown.bs.modal', () => {
	const elModal = $('#load-preset-modal')
	elModal.find('.body-item').hide()

	let presetData = JSON.parse(localStorage.getItem('arti-presets')) || []
	if(!presetData.length) {
		elModal.find('.no-data').show()
		return
	}

	elModal.find('.preset-data').show()
	
	let html = ''
	let i = 0
	presetData.forEach((v, k) => {
		i++
		console.log(v)
		// console.log(k)
		html += `<tr data-index="${k}">`
		html += '<td class="text-end">'
		html += '#' + i 
		html += '</td>'
		html += '<td>'
		// html += '<i class="fa-solid fa-circle-info"></i>'
		// html += ' '
		html += '<strong class="preset-name">' + v.name + '</strong>'
		html += '</td>'
		html += '<td class="text-end">'
		// html += '<span data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Tooltip on bottom">'
		// html += new Date(v.time).toLocaleString()
		html += '<em title="' + new Date(v.time) + '">' + getFormattedDate(v.time) + '</em>'
		// html += '</span>'
		html += '</td>'
		html += '<td class="text-center">'
		html += '<button type="button" class="btn btn-primary btn-sm load-preset"><i class="fa-regular fa-folder-open"></i> Load</button>'
		html += ' '
		html += '<button type="button" class="btn btn-danger btn-sm delete-preset"><i class="fa-solid fa-trash-can"></i> Delete</button>'
		html += '</div>'
		html += '</td>'
	})

	elModal.find('.preset-data tbody').html(html)
})

$('#save-preset-modal').on('shown.bs.modal', () => {
	$('#save-preset-preview-table .arti-preview').each(function() {
		let targetId = '#' + $(this).data('id')
		$(this).find('.value').text($(targetId).val())
	})

	let tdBonusCB = localStorage.getItem('save-td-bonus-cb')
	if (tdBonusCB !== null) {
		$('#save-td-bonus-cb').prop('checked', !!parseInt(tdBonusCB));
	}
	toggleSaveTDBonusRow()

    $('#save-preset-name').focus()
})

$('#save-td-bonus-cb').on('change', function() {
	localStorage.setItem('save-td-bonus-cb', +$(this).is(':checked'))
	toggleSaveTDBonusRow()
});

const toggleTheme = () => {
	const theme = $('html').attr('data-bs-theme') === 'light' ? 'dark' : 'light'
	setTheme(theme)
	localStorage.setItem('theme', theme)
}

const setTheme = (theme) => {
	const icons = {
		light: '<i class="fa-solid fa-sun"></i>',
		dark: '<i class="fa-solid fa-moon"></i>'
	}

	$('html').attr('data-bs-theme', theme)
	$('#theme-toggle').html(icons[theme])
}

const loadTheme = () => {
	let theme = localStorage.getItem('theme')
	if(!theme) return;

	setTheme(theme)
}

const toggleSaveTDBonusRow = () => {
	const isChecked = $('#save-td-bonus-cb').prop('checked')

	const elTr = $('#save-preset-preview-table .td-bonus-preview')

	if(isChecked) {
		elTr.find('.value').html($('#td-bonus').val() + '%')
		elTr.show()
	} else {
		elTr.hide()
	}
}

const savePreset = (name) => {
	let presetData = JSON.parse(localStorage.getItem('arti-presets')) || []
	let data = {
		name: name,
		time: new Date().getTime(),
		arti: {},
		tdb: $('#save-td-bonus-cb').prop('checked') ? $('#td-bonus').val() : null
	}

	$('.arti-select').each(function() {
		data.arti[$(this).attr('id').replace(/^arti-/, '')] = $(this).val()
	})

	console.log(data)
	presetData.push(data)
	console.log(presetData)
	localStorage.setItem('arti-presets', JSON.stringify(presetData))

	iziToast.destroy()
	iziToast.success({
	    message: `Preset <strong>${data.name}</strong> saved successfully`,
	})

	$('#save-preset-name').val('')
	$('#save-preset-modal').modal('hide')
	// console.log(localStorage.getItem('arti-presets'))
	// console.log(JSON.parse(localStorage.getItem('arti-presets')))
}

const getFormattedDate = (timestamp) => {
	const date = new Date(timestamp);

	return [
		date.getDate(),
		date.toLocaleString('default', { month: 'short' }),
		date.getFullYear(),
		`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
	].join(' ');
}

const loadPreset = (index) => {
	let presetData = JSON.parse(localStorage.getItem('arti-presets')) || []
	let data = presetData[index]

	if(typeof data === 'undefined') {
		alert('Error loading preset!')
		return
	}

	Object.entries(data.arti).forEach(([k, v]) => {
		$('#arti-' + k).val(v)
	})

	if(data.tdb !== null) {
		$('#td-bonus').val(data.tdb)
	}

	calc()

	iziToast.destroy()
	iziToast.success({
	    message: `Preset <strong>${data.name}</strong> loaded successfully`,
	})

	$('#load-preset-modal').modal('hide');
}

const deletePreset = (index) => {
	let presetData = JSON.parse(localStorage.getItem('arti-presets')) || []
	let current = presetData[index]
	presetData.splice(index, 1)
	localStorage.setItem('arti-presets', JSON.stringify(presetData))
	$(`#artil-preset-list-table tr[data-index="${index}"]`).remove()
	iziToast.destroy()
	iziToast.success({
	    message: `Preset <strong>${current.name}</strong> deleted successfully`,
	})
}

const calc = () => {
	// console.log('calc')
	console.clear()
	slt = getSltCount()
	calcArti()
	calcStonesAndTd()

	maxIndex = getMaxIndex(map, 'rate')
	max = map[maxIndex]

	console.table(max)

	showCalc()
	showDetails()
}

const getSltCount = () => {
	let sum = 0;
    $('.arti-select').each(function() {
        let elOption = $(this).find('option:selected')
        sum += parseInt(elOption.attr('data-slt')) || 0
    });
    return sum;
}

const calcArti = () => {
	lay = shp = 1;
	arti = [];
	$('.arti-select').each(function() {
		let elOption = $(this).find('option:selected')
		lay = multiply(lay, elOption.data('lay'))
		shp = multiply(shp, elOption.data('shp'))

		arti.push({
			arti: $(this).attr('id'),
			type: elOption.val(),
			lay: lay,
			shp: shp
		})
	});

	console.table(arti)
}

const calcStonesAndTd = () => {
	map = [];

	for(let i = slt; i >= 0; i--) {
		let j = slt - i;
		
		let newLay = lay;
		let newShp = shp;

		for (let c = 0; c < i; c++) {
			newLay = multiply(newLay, 5)
		}
		for (let c = 0; c < j; c++) {
			newShp = multiply(newShp, 5)
		}

		let tdLay = multiply(newLay, parseInt($('#td-bonus').val()));

		let set = {
			tach: i, qant: j, 
			stoneLay: newLay, 
			xLay: tdLay, 
			xShp: newShp,
		};

		set.lay = BASE_LAY * set.xLay
		set.shp = BASE_SHP * set.xShp
		set.rate = Math.min(set.lay, set.shp)
		
		map.push(set)
	}

	console.table(map)
}

const showCalc = () => {
	$('#info-slt-count').html(slt)
	$('#info-tach-count').html(max.tach)
	$('#info-qant-count').html(max.qant)
	$('#info-rate').html(max.rate.toFixed(PRECISION) + 'q/hr')
	$('#info-lay').html(max.lay.toFixed(PRECISION) + 'q/hr')
	$('#info-shp').html(max.shp.toFixed(PRECISION) + 'q/hr')
	$('#info-x-lay').html('(x' + max.xLay.toFixed(PRECISION) + ')')
	$('#info-x-shp').html('(x' + max.xShp.toFixed(PRECISION) + ')')
}

const showDetails = () => {
	showArtiDetails()
	showStoneDetails()
}

const showArtiDetails = () => {
	let html = ''
	$('.arti-select').each(function() {
		let elOption = $(this).find('option:selected')
		html += '<tr>'
		html += '<td>'
		html += $(`label[for="${$(this).attr('id')}"]`).text()
		html += '</td>'
		html += '<td class="text-center">'
		html += $(this).val()
		html += '</td>'
		html += '<td class="text-end">'
		html += elOption.data('slt')
		html += '</td>'
		html += '<td class="text-end">'
		html += elOption.data('lay') + '%'
		html += '</td>'
		html += '<td class="text-end">'
		html += elOption.data('shp') + '%'
		html += '</td>'
		html += '</tr>'
	})

	$('#arti-details-table tbody').html(html)

	$('#arti-details-table tfoot .slt').html(slt)
	$('#arti-details-table tfoot .lay').html('x' + lay.toFixed(PRECISION))
	$('#arti-details-table tfoot .shp').html('x' + shp.toFixed(PRECISION))
}

const showStoneDetails = () => {
	let html = ''
	let i = 0
	map.forEach((v, k) => {
		i++
		let attrClass = (k == maxIndex) ? ' class="highlight"' : ''
		html += `<tr${attrClass}>`
		html += '<td class="text-end">'
		html += i
		html += '</td>'
		html += '<td class="text-end">'
		html += v.tach
		html += '</td>'
		html += '<td class="text-end">'
		html += v.qant
		html += '</td>'
		html += '<td class="text-end">'
		html += 'x' + v.stoneLay.toFixed(PRECISION)
		html += '</td>'
		html += '<td class="text-end">'
		html += formatValue(v.lay, v.xLay, PRECISION)
		html += '</td>'
		html += '<td class="text-end">'
		html += formatValue(v.shp, v.xShp, PRECISION)
		html += '</td>'
		html += '</tr>'
	})

	$('#stone-details-table tbody').html(html)
}

const getMaxIndex = (arr, key) => {
    let max = -Infinity
    let maxIndex = -1

    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] > max) {
            max = arr[i][key]
            maxIndex = i
        }
    }

    return maxIndex
}

const formatValue = (value, multiplier, precision) => {
    return `${value.toFixed(precision)} (x${multiplier.toFixed(precision)})`
}

const multiply = (num, pct) => {
	if(pct == 0) return num
	return num * (1 + pct / 100)
}


