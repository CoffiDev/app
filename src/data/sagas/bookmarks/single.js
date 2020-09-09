import { call, spawn, put, takeEvery, select, all } from 'redux-saga/effects'
import Api from '../../modules/api'

import {
	BOOKMARK_CREATE_REQ, BOOKMARK_CREATE_SUCCESS, BOOKMARK_CREATE_ERROR,
	BOOKMARK_UPDATE_REQ, BOOKMARK_UPDATE_SUCCESS, BOOKMARK_UPDATE_ERROR,
	BOOKMARK_REMOVE_REQ, BOOKMARK_REMOVE_SUCCESS, BOOKMARK_REMOVE_ERROR,
	BOOKMARK_UPLOAD_REQ,
	BOOKMARK_REORDER, BOOKMARK_COVER_UPLOAD_REQ,

	BOOKMARK_RECOVER, BOOKMARK_IMPORTANT, BOOKMARK_SCREENSHOT, BOOKMARK_REPARSE, BOOKMARK_MOVE, BOOKMARK_PRELOAD
} from '../../constants/bookmarks'

import {
	getBookmark,
	getBookmarkScreenshotIndex,
	getMeta
} from '../../helpers/bookmarks'

//Requests
export default function* () {
	//helpers
	yield takeEvery(BOOKMARK_RECOVER, recover)
	yield takeEvery(BOOKMARK_IMPORTANT, important)
	yield takeEvery(BOOKMARK_SCREENSHOT, screenshot)
	yield takeEvery(BOOKMARK_REPARSE, reparse)
	yield takeEvery(BOOKMARK_MOVE, move)
	yield takeEvery(BOOKMARK_PRELOAD, preload)
	yield takeEvery(BOOKMARK_REORDER, reorder)
	yield takeEvery(BOOKMARK_COVER_UPLOAD_REQ, uploadCover)

	//single
	yield takeEvery(BOOKMARK_CREATE_REQ, createBookmark)
	yield takeEvery(BOOKMARK_UPDATE_REQ, updateBookmark)
	yield takeEvery(BOOKMARK_REMOVE_REQ, removeBookmark)
	yield takeEvery(BOOKMARK_UPLOAD_REQ, uploadBookmark)
}

function* createBookmark({obj={}, ignore=false, draft, onSuccess, onFail}) {
	if (ignore)
		return;

	try{
		let item = { ...obj }

		//minimum info is already provided, grab all other in background on server
		if (item.title)
			item.pleaseParse = { weight: 1 }
		//parse bookmark otherwise
		else {
			const parsed = yield call(Api.get, 'parse?url='+encodeURIComponent(item.link))

			//override empty values
			for(const key in parsed.item)
				if (!item[key])
					item[key] = parsed.item[key]
		}

		//try to create bookmark on server
		let res
		try {
			res = yield call(Api.post, 'raindrop', item)
		} catch (e) {}

		//try again, maybe it's collectionId related issue
		if (!res)
			res = yield call(Api.post, 'raindrop', {...item, collectionId: -1 })

		yield put({
			type: BOOKMARK_CREATE_SUCCESS,
			_id: res.item._id,
			item: res.item,
			draft,
			onSuccess, onFail
		});
	} catch (error) {
		yield put({
			type: BOOKMARK_CREATE_ERROR,
			obj,
			draft,
			error,
			onSuccess, onFail
		});
	}
}

function* uploadBookmark({obj={}, ignore=false, onSuccess, onFail}) {
	if (ignore)
		return;

	try{
		//Todo: Check collectionId before creating bookmark!

		const { item={} } = yield call(Api.upload, 'raindrop/file', obj)

		yield put({
			type: BOOKMARK_CREATE_SUCCESS,
			_id: item._id,
			item: item,
			onSuccess, onFail
		});
	} catch (error) {
		yield put({
			type: BOOKMARK_CREATE_ERROR,
			obj,
			error,
			onSuccess, onFail
		});
	}
}

function* updateBookmark({_id, set={}, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		const { item={} } = yield call(Api.put, 'raindrop/'+_id, set)

		yield put({
			type: BOOKMARK_UPDATE_SUCCESS,
			item: item,
			onSuccess, onFail
		});
	} catch (error) {
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id,
			error,
			onSuccess, onFail
		});
	}
}

function* removeBookmark({_id, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		yield call(Api.del, 'raindrop/'+_id)

		yield put({
			type: BOOKMARK_REMOVE_SUCCESS,
			_id,
			onSuccess, onFail
		});
	} catch (error) {
		yield put({
			type: BOOKMARK_REMOVE_ERROR,
			_id,
			error,
			onSuccess, onFail
		});
	}
}

function* recover({_id, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		const state = yield select()
		const item = getBookmark(state.bookmarks, _id)

		yield put({
			type: BOOKMARK_UPDATE_REQ,
			_id: item._id,
			set: {
				collectionId: -1,
				removed: false
			},
			onSuccess
		})
	}catch(error){
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id: _id,
			error,
			onFail
		})
	}
}

function* important({_id, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		const state = yield select()
		const item = getBookmark(state.bookmarks, _id)

		yield put({
			type: BOOKMARK_UPDATE_REQ,
			_id: item._id,
			set: {
				important: item.important
			},
			onSuccess
		})
	}catch(error){
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id: _id,
			error,
			onFail
		})
	}
}

function* screenshot({_id, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		const state = yield select()
		const item = getBookmark(state.bookmarks, _id)
		const meta = getMeta(state.bookmarks, _id)
		const screenshotIndex = getBookmarkScreenshotIndex(state.bookmarks, _id)

		var setReq = {}
		if (screenshotIndex!=-1){
			setReq = {
				coverId: screenshotIndex
			}
		}else{
			const newMedia = meta.media.concat([{link: '<screenshot>'}])
			setReq = {
				media: newMedia,
				coverId: newMedia.length-1
			}
		}

		yield put({
			type: BOOKMARK_UPDATE_REQ,
			_id: item._id,
			set: setReq,
			onSuccess
		})
	}catch(error){
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id: _id,
			error,
			onFail
		})
	}
}

function* reparse({_id, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		const state = yield select()
		const item = getBookmark(state.bookmarks, _id)

		yield put({
			type: BOOKMARK_UPDATE_REQ,
			_id: item._id,
			set: {
				pleaseParse: {
					date: new Date()
				}
			},
			onSuccess
		})
	}catch(error){
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id: _id,
			error,
			onFail
		})
	}
}

function* move({_id, collectionId, ignore=false, onSuccess, onFail}) {
	if ((ignore)||(!_id))
		return;

	try{
		yield put({
			type: BOOKMARK_UPDATE_REQ,
			_id: _id,
			set: {
				collectionId: collectionId
			},
			onSuccess
		})
	}catch(error){
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id: _id,
			error,
			onFail
		})
	}
}

function* preload({link}) {
	try{
		yield call(Api.get, 'parse?url='+encodeURIComponent(link))
	} catch(error){}
}

function* reorder({ _id, ignore, order, collectionId }) {
	if (ignore || typeof order == 'undefined') return

	yield put({
		type: BOOKMARK_UPDATE_REQ,
		_id: _id,
		set: {
			order,
			collectionId
		}
	})
}

function* uploadCover({ _id=0, cover, ignore=false, onSuccess, onFail }) {
	if (ignore) return

	try{
		const { item={} } = yield call(Api.upload, `raindrop/${_id}/cover`, { cover })

		yield put({
			type: BOOKMARK_UPDATE_REQ,
			_id,
			item: item,
			onSuccess, onFail
		});
	} catch (error) {
		yield put({
			type: BOOKMARK_UPDATE_ERROR,
			_id,
			error,
			onSuccess, onFail
		});
	}
}