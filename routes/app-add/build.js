const router = require('express').Router();
const formidable = require('formidable');
const del = require('del');
const makeDir = require('make-dir');
const path = require('path');
const fse = require('fs-extra');

/** ROUTES **/
router.get('/', async(req, res, next) => {
    try {
        res.render('pages/app-add/build', {
            page: 'build',
            title: 'Добавление приложения'
        });
    } catch(e) {
        console.log('error', modules.timeNow(), e.toString());
        next(e);
    }
});

router.post('/', async(req, res, next) => {
    try {
        await del(lib.appDir, {force: true});
        await Promise.all([
            makeDir(lib.appDir + '/apk'),
            makeDir(lib.appDir + '/config'),
            makeDir(lib.appDir + '/images/logo'),
            makeDir(lib.appDir + '/images/gallery'),
            makeDir(lib.appDir + '/images/banner')
        ]);
        let data = await formidablePromise(req, null);
        res.json({result: data, status: 200});
    } catch(e) {
        console.log('error', modules.timeNow(), e.toString());
        res.json({status: 500, message: e.toString()});
        next(e);
    }
});

function formidablePromise(req, opts) {
    return new Promise((resolve, reject) => {
        let form = new formidable.IncomingForm(opts);

        let config = {
            files: {
                apk: null,
                images: {
                    banner: null,
                    gallery: [],
                    logo: null
                }
            }
        };

        form.multiples = true;
        form.uploadDir = lib.appDir;

        form.parse(req);
        form
            .on('error', (err) => {
                if (err) return reject(err)
            })
            .on('field', (field, value) => {
                // console.log(field, value, typeof value);
                if (value !== 'undefined') {
                    if (field === 'keywords') {
                        if (value.length !== 0) {
                            config['keywords'] = value.split(" ");
                        } else {
                            config['keywords'] = [];
                        }
                    } else {
                        config[field] = value;
                    }
                }
            })
            .on('fileBegin', (field, file) => {
                if (field === 'apk')
                    file.path = form.uploadDir + '/apk/' + file.name;
                if (field === 'gallery')
                    file.path = form.uploadDir + '/images/gallery/' + file.name;
                if (field === 'banner')
                    file.path = form.uploadDir + '/images/banner/' + file.name;
                if (field === 'logo')
                    file.path = form.uploadDir + '/images/logo/' + file.name;
            })
            .on('file', (field, file) => {
                let url = path.relative(lib.appDir, file.path).replace(/\\/g, "\/");
                if (field === 'apk')
                    config.files.apk = url;
                if (field === 'logo')
                    config.files.images.logo = url;
                if (field === 'gallery')
                    config.files.images.gallery.push(url);
                if (field === 'banner')
                    config.files.images.banner = url;
            })
            .on('end', async() => {
                await fse.outputJson(lib.appDir + '/config/config.json', config);
                resolve(config);
            })
    })
}

module.exports = router;
