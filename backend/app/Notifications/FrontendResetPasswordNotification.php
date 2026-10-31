<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FrontendResetPasswordNotification extends Notification
{
    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5176'), '/');
        $url = $frontendUrl.'/admin/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Reset your school account password')
            ->greeting('Hello!')
            ->line('We received a request to reset the password for your school account.')
            ->action('Reset password', $url)
            ->line('This link expires in 60 minutes. If you did not request a reset, no action is needed.');
    }
}
