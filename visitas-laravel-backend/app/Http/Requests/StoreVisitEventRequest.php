<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisitEventRequest extends FormRequest
{
    public function authorize()
    {
        // Allow only users who can update the related Visit (host, reception, admin)
        $visit = $this->route('visit');
        if (! $visit) {
            return true;
        }

        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->can('update', $visit);
    }

    public function rules()
    {
        return [
            'type' => ['required', 'string', 'max:100'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string'],
            'timestamp' => ['nullable', 'date'],
        ];
    }
}
