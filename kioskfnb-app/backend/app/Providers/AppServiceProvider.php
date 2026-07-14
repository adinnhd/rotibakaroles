<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Mail::extend('mailtrap', function (array $config) {
            return \Symfony\Component\Mailer\Transport::fromDsn(
                "mailtrap+sandbox://{$config['token']}@default?inboxId={$config['inbox_id']}"
            );
        });
    }
}
