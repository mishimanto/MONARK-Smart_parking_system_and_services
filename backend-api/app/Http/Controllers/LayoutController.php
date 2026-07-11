<?php
namespace App\Http\Controllers;

use App\Http\Controllers\SiteSettingController;

class LayoutController extends Controller
{
    public function getContact()
    {
        return app(SiteSettingController::class)->contactInfo();
    }
}
