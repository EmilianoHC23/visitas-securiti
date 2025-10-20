<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisitEventRequest extends FormRequest
{
    public function authorize()
    {
        // Allow and let controller/policy handle stricter rules if needed
        return true;
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
